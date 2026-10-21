// SmartHire Sourcing Copilot v3.6 - Injected Dock with Browserflow Visual Studio
(function() {
  // Always clean up any existing trigger, drawer, or inspector elements to allow hot re-mounts
  const cleanupIds = [
    'smarthire-copilot-trigger',
    'smarthire-copilot-drawer',
    'smarthire-inspect-box',
    'smarthire-inspect-badge',
    'smarthire-inspect-banner'
  ];
  cleanupIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });

  let scrapedCandidates = [];
  
  // Synchronous jobs initialization (guarantees all 180 jobs are ready immediately)
  let allJobs = (window.SMARTHIRE_BUNDLED_JOBS && Array.isArray(window.SMARTHIRE_BUNDLED_JOBS)) 
    ? window.SMARTHIRE_BUNDLED_JOBS 
    : [
        { id: '159287', title: 'Microsoft .NET Developer', location: 'Richmond, VA', skills: ['.NET Core', 'C#', 'SQL Server', 'Angular', 'Web API'] },
        { id: '159023', title: 'Business Analyst', location: 'Columbia, SC', skills: ['SharePoint', 'MS Excel', 'Agile', 'Requirements Gathering'] },
        { id: '159281', title: 'Information Technology Administrator', location: 'Madison, WI', skills: ['Windows Server', 'SOC', 'Active Directory', 'Azure'] }
      ];
  let filteredJobs = [...allJobs];
  let selectedJob = allJobs.length > 0 ? allJobs[0] : null;

  // Active Flow Configuration (Saved in localStorage or presets)
  let activeFlow = {
    containerSelector: '.smui-card',
    clickSelector: '.smui-card-body',
    tabSelector: '.tab__label',
    nameSelector: '.candidate-name, a[href*="/candidate/"], h2, h3',
    emailSelector: '#contact-legend-detail',
    phoneSelector: '#contact-legend-detail',
    delayMs: 800
  };

  // Try loading saved flow from storage
  try {
    const saved = localStorage.getItem('smarthire_custom_flow');
    if (saved) activeFlow = Object.assign(activeFlow, JSON.parse(saved));
  } catch (e) {}

  let currentUser = null;
  let isUserAuthenticated = false;
  let activeOutreachCandidate = null;
  const sentCandidateEmails = new Set();
  let selectedCandidateIndices = new Set();

  function sanitizeJobDescription(desc) {
    if (!desc) return '';
    if (window.SmartHireMatchingEngine && typeof window.SmartHireMatchingEngine.formatJobDescriptionForOutreach === 'function') {
      const res = window.SmartHireMatchingEngine.formatJobDescriptionForOutreach(desc);
      return res?.body || String(desc);
    }
    let text = String(desc);
    // Strip rates, compensation, requisition numbers, and deadlines
    text = text.replace(/(bill\s*rate|pay\s*rate|hourly\s*rate|rate|salary|budget|compensation)\s*[:=-]?\s*\$?\s*\d+(\.\d+)?(\s*[\/\-]\s*(hr|hour|yr|year|annum))?/gi, '');
    text = text.replace(/\$\d+(\.\d+)?\s*[\/\-]\s*(hr|hour|yr|year|annum)/gi, '');
    text = text.replace(/\$\d{2,3}(,\d{3})*(\s*[\/\-]\s*(hr|hour|yr|year|annum))?/gi, '');
    text = text.replace(/\b\d{2,3}\s*[\/\-]\s*hr\b/gi, '');
    text = text.replace(/\b(req|requisition|job\s*id|req\s*#|req\s*id)\s*[:#=-]?\s*#?\d+/gi, '');
    text = text.replace(/#\d{5,8}\b/g, '');
    text = text.replace(/\b159\d{3}\b/g, '');
    text = text.replace(/Submission deadline\s*:\s*[\d\/\:\sAMPamp]+/gi, '');
    text = text.replace(/Start date\s*:\s*[\d\/\:\sAMPamp]+/gi, '');
    text = text.replace(/End Date\s*:\s*[\d\/\:\sAMPamp]+/gi, '');
    text = text.replace(/Client\s*Info\s*:\s*[^:\n\r*]+(?=(?:\bNote\b|\bStart\b|\bEnd\b|\bDescription\b|\bSubmission\b|\*)|$)/gi, '');
    text = text.replace(/^[A-Za-z\s]+:\s*(?:Bachelors Degree|Computer Science|IT Experience|Information Technology|Master|Degree)[^:\n]*[,;\-]\s*/gi, '');
    text = text.replace(/as well as a vendor present at beginning of virtual interview to validate candidate[.]?/gi, '');
    text = text.replace(/-Candidates must meet all these requirements from the beginning \(non negotiable\)/gi, '');
    text = text.replace(/This requirement is non-negotiable/gi, '');
    text = text.replace(/([.?!])\s*•\s*/g, '$1\n• ');
    text = text.replace(/\s*•\s*/g, '\n• ');
    text = text.replace(/\n{3,}/g, '\n\n').trim();
    return text;
  }

  function cleanJobTitle(rawTitle) {
    if (!rawTitle) return 'Technical Specialist';
    if (window.SmartHireMatchingEngine && typeof window.SmartHireMatchingEngine.cleanJobTitleForSearch === 'function') {
      return window.SmartHireMatchingEngine.cleanJobTitleForSearch(rawTitle) || 'Technical Specialist';
    }
    let str = String(rawTitle);
    str = str.replace(/#\d+/g, ' ');
    str = str.replace(/\bREQ[-_]?\d+\b/gi, ' ');
    str = str.replace(/\b159\d{3}\b/g, ' ');
    str = str.replace(/\([^)]*\)/g, ' ');
    str = str.replace(/\[[^\]]*\]/g, ' ');
    str = str.replace(/[-—–|/\\:_;~]+/g, ' ');
    str = str.replace(/\b(?:level|lvl|tier|grade|step)\s*(?:[0-9]+|[ivx]+)?\b/gi, ' ');
    str = str.replace(/\b[lt][0-9]+\b/gi, ' ');
    str = str.replace(/\b(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV)\b/gi, ' ');
    str = str.replace(/\b\d+\b/g, ' ');
    str = str.replace(/\d+/g, ' ');
    str = str.replace(/\b(?:senior|sr\.?|advance|advanced|junior|jr\.?|principal|lead|staff|associate|entry(?:\s+level)?)\b/gi, ' ');
    str = str.replace(/\s+/g, ' ').trim();
    return str || 'Technical Specialist';
  }

  function generateOutreachDraft(candidate, job) {
    const rawName = (candidate.name || 'Candidate').replace(/\(.*\)/g, '').trim();
    const cleanTitle = cleanJobTitle(job ? job.title : 'Technical Specialist');

    if (window.SmartHireMatchingEngine && typeof window.SmartHireMatchingEngine.formatJobDescriptionForOutreach === 'function') {
      const formatted = window.SmartHireMatchingEngine.formatJobDescriptionForOutreach(job, rawName, currentUser || {});
      return {
        to: candidate.email || '',
        candidateName: rawName,
        subject: formatted.subject,
        body: formatted.body,
        cleanTitle: formatted.cleanTitle
      };
    }

    const firstName = rawName.split(' ')[0] || 'there';
    const location = job?.location || 'United States (Remote / Onsite as required)';
    const cleanDesc = sanitizeJobDescription(job?.description || job?.fullDescription || job?.rawDescription || '');
    const subject = `Direct Client: ${cleanTitle} — COOLSOFT LLC`;

    const recruiterDisplayName = currentUser ? currentUser.name : 'Technical Recruiter';
    const recruiterWorkEmail = currentUser ? currentUser.email : 'recruiting@coolsofttech.com';

    const body = `Hi ${firstName},

I hope this email finds you well.

COOLSOFT LLC has an immediate opening for a ${cleanTitle} role that aligns closely with your expertise. Below is the position summary for your review:

==================================================
POSITION OVERVIEW
==================================================
• Role: ${cleanTitle}
• Location: ${location}
• Work Authorization: US Citizen / Green Card / Authorized to Work in US

${cleanDesc}

If you are open to exploring this opportunity, please reply to this email with your updated resume, or let me know a convenient time for a brief introductory call.

Best regards,

${recruiterDisplayName}
Technical Recruiter | COOLSOFT LLC
Email: ${recruiterWorkEmail}
Website: http://www.coolsofttech.com`;

    return {
      to: candidate.email || '',
      candidateName: rawName,
      subject,
      body,
      cleanTitle
    };
  }

  function initDock() {
    // 1. Discreet 38px Shield Logo Trigger (No long text strip!)
    const trigger = document.createElement('div');
    trigger.id = 'smarthire-copilot-trigger';
    trigger.title = 'SmartHire ATS Sourcing Copilot v4.3 (Click to Open)';
    trigger.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#3B82F6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="m9 11 2 2 4-4" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
    `;

    // 2. Slide-out Drawer Panel
    const drawer = document.createElement('div');
    drawer.id = 'smarthire-copilot-drawer';
    drawer.innerHTML = `
      <div class="smarthire-drawer-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#3B82F6">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 11 2 2 4-4" stroke="#ffffff" stroke-width="2.5" fill="none"/>
          </svg>
          <span style="font-weight:700; font-size:14px; letter-spacing:-0.02em;">SmartHire Copilot</span>
          <span style="background:#1E293B; color:#93C5FD; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; border:1px solid #334155;">v4.3 Live</span>
        </div>
        <button id="smarthire-drawer-close" style="background:none; border:none; color:#94A3B8; font-size:22px; cursor:pointer; line-height:1; padding:0 4px;">&times;</button>
      </div>

      <!-- Recruiter Identity Bar -->
      <div id="smarthire-recruiter-bar" class="smarthire-recruiter-bar">
        <div style="display:flex; align-items:center; gap:6px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span id="smarthire-recruiter-name-label" style="font-weight:700; color:#F8FAFC; font-size:11.5px;">Not Signed In</span>
          <span id="smarthire-recruiter-email-label" style="color:#94A3B8; font-size:10.5px;">(Login Required)</span>
        </div>
        <button id="smarthire-btn-auth-toggle" class="smarthire-link-btn" style="color:#38BDF8;">Sign In</button>
      </div>

      <!-- Navigation Tabs: Quick Sourcing vs Browserflow Studio -->
      <div class="smarthire-nav-tabs">
        <button class="smarthire-tab-btn active" id="tab-btn-quick">⚡ Quick Sourcing</button>
        <button class="smarthire-tab-btn" id="tab-btn-flow">🛠 Browserflow Studio</button>
      </div>

      <div class="smarthire-drawer-body">
        
        <!-- AUTHENTICATION REQUIRED LOCK GATE -->
        <div id="smarthire-auth-gate" class="smarthire-auth-gate" style="display:none; padding:22px 18px; background:#FFFFFF; border:1px solid #CBD5E1; border-radius:10px; box-shadow:0 6px 18px rgba(0,0,0,0.05); margin-top:8px;">
          <div class="smarthire-auth-gate-icon" style="width:44px; height:44px; border-radius:50%; background:#EFF6FF; border:1px solid #BFDBFE; display:flex; align-items:center; justify-content:center; margin:0 auto 12px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div style="font-weight:800; font-size:14.5px; color:#0F172A; margin-bottom:4px; text-align:center;">Recruiter Login Required</div>
          <div style="font-size:11px; color:#64748B; margin-bottom:16px; line-height:1.45; text-align:center;">
            Sign in with your SmartHire ATS recruiter credentials to access live requisitions, candidate scraping, and email outreach.
          </div>
          
          <div style="margin-bottom:10px; text-align:left;">
            <label style="display:block; font-size:11px; font-weight:700; color:#334155; margin-bottom:4px;">Work Email</label>
            <input type="email" id="smarthire-gate-email" placeholder="Enter work email" class="smarthire-input" style="width:100%; box-sizing:border-box; font-size:12px; padding:8px 10px;" />
          </div>

          <div style="margin-bottom:14px; text-align:left;">
            <label style="display:block; font-size:11px; font-weight:700; color:#334155; margin-bottom:4px;">Password</label>
            <input type="password" id="smarthire-gate-pass" placeholder="Enter password" class="smarthire-input" style="width:100%; box-sizing:border-box; font-size:12px; padding:8px 10px;" />
          </div>

          <button id="smarthire-gate-btn-login" class="smarthire-btn-primary" style="width:100%; height:38px; padding:0; font-size:12.5px; font-weight:700; border-radius:6px; background:#2563EB; box-shadow:0 2px 6px rgba(37,99,235,0.25); display:flex; align-items:center; justify-content:center; gap:6px; cursor:pointer; margin-top:4px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            <span>Sign In to SmartHire Copilot</span>
          </button>
          
          <div id="smarthire-gate-status" style="font-size:11.5px; margin-top:10px; min-height:18px; text-align:center; font-weight:600;"></div>
        </div>

        <!-- VIEW 1: QUICK SOURCING TAB -->
        <div id="view-quick-sourcing">
          <!-- Requisition Selector Card -->
          <div class="smarthire-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <label class="smarthire-label" style="margin-bottom:0;">ATS Target Requisition</label>
              <div style="display:flex; align-items:center; gap:6px;">
                <span id="smarthire-job-count-badge" style="font-size:10px; color:#2563EB; font-weight:700;">${allJobs.length} Jobs</span>
                <span id="smarthire-refresh-jobs" style="font-size:10px; color:#64748B; cursor:pointer; text-decoration:underline;">Refresh</span>
              </div>
            </div>

            <!-- Instant Search Input for 500+ Requisitions -->
            <input 
              type="text" 
              id="smarthire-req-filter" 
              placeholder="Filter 500+ jobs (.NET, BA, Java, #159348)..." 
              class="smarthire-input" 
              style="margin-bottom:6px; font-size:11.5px; padding:6px 9px;"
            />

            <!-- Synchronously rendered Select dropdown -->
            <select id="smarthire-req-select" class="smarthire-select">
              ${filteredJobs.map(j => `<option value="${j.id || j.reqId}">#${j.id || j.reqId} · ${j.title} (${j.location || 'Remote'})</option>`).join('')}
            </select>

            <div id="smarthire-req-info" style="margin-top:8px; font-size:11px; color:#475569; background:#F8FAFC; border:1px solid #E2E8F0; padding:8px 10px; border-radius:6px;"></div>

            <button type="button" id="smarthire-btn-autosearch" class="smarthire-btn-secondary" style="margin-top:8px;">
              🔍 Auto-Fill Search on Current Page
            </button>
          </div>

          <!-- Quick Extraction Action Card -->
          <div class="smarthire-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <label class="smarthire-label" style="margin-bottom:0;">Candidate Extraction</label>
              <span style="font-size:10px; color:#059669; font-weight:700;">Deep Click Scraper</span>
            </div>
            
            <button type="button" id="smarthire-btn-scrape" class="smarthire-btn-primary">
              ⚡ 1-Click Scrape Candidates
            </button>
            
            <div id="smarthire-scrape-status" style="margin-top:8px; font-size:11px; color:#64748B; text-align:center; font-weight:500; min-height:18px;">
              Auto-clicks cards to extract verified phone numbers & emails from detail pane
            </div>
          </div>
        </div>

        <!-- VIEW 2: BROWSERFLOW STUDIO (RECORD & CONFIGURE WORKFLOW) -->
        <div id="view-flow-studio" style="display: none;">
          <div class="smarthire-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <label class="smarthire-label" style="margin-bottom:0;">Workflow Presets</label>
              <span style="font-size:10px; color:#2563EB; font-weight:700;">Browserflow Model</span>
            </div>
            <div style="display:flex; gap:6px; margin-bottom:12px;">
              <button type="button" class="smarthire-btn-secondary" id="preset-monster" style="flex:1; margin-top:0; font-size:10.5px;">
                Monster+ Preset
              </button>
              <button type="button" class="smarthire-btn-secondary" id="preset-dice" style="flex:1; margin-top:0; font-size:10.5px;">
                Dice Preset
              </button>
              <button type="button" class="smarthire-btn-secondary" id="preset-reset" style="flex:1; margin-top:0; font-size:10.5px;">
                Custom
              </button>
            </div>

            <!-- Field 1: Card Container Selector -->
            <div class="smarthire-field-row">
              <div class="smarthire-field-label-group">
                <span class="smarthire-field-label">1. Card Container Selector (Loop Elements)</span>
                <span id="container-count-badge" style="font-size:9.5px; color:#059669; font-weight:700;"></span>
              </div>
              <div class="smarthire-input-pick-group">
                <input type="text" id="flow-container-sel" class="smarthire-input" value="${activeFlow.containerSelector}" placeholder="e.g. smui-card" />
                <button type="button" class="smarthire-btn-pick" data-target="flow-container-sel">🎯 Pick</button>
              </div>
            </div>

            <!-- Field 2: Card Click Target -->
            <div class="smarthire-field-row">
              <div class="smarthire-field-label-group">
                <span class="smarthire-field-label">2. Click Target Selector (Open Details)</span>
              </div>
              <div class="smarthire-input-pick-group">
                <input type="text" id="flow-click-sel" class="smarthire-input" value="${activeFlow.clickSelector}" placeholder="e.g. .smui-card-body" />
                <button type="button" class="smarthire-btn-pick" data-target="flow-click-sel">🎯 Pick</button>
              </div>
            </div>

            <!-- Field 3: Tab Click Selector (Optional) -->
            <div class="smarthire-field-row">
              <div class="smarthire-field-label-group">
                <span class="smarthire-field-label">3. Tab Switch Selector (Optional)</span>
              </div>
              <div class="smarthire-input-pick-group">
                <input type="text" id="flow-tab-sel" class="smarthire-input" value="${activeFlow.tabSelector}" placeholder="e.g. li:nth-of-type(2) > .tab__title > .tab__label" />
                <button type="button" class="smarthire-btn-pick" data-target="flow-tab-sel">🎯 Pick</button>
              </div>
            </div>

            <!-- Field 4: Name Selector -->
            <div class="smarthire-field-row">
              <div class="smarthire-field-label-group">
                <span class="smarthire-field-label">4. Candidate Name Selector</span>
              </div>
              <div class="smarthire-input-pick-group">
                <input type="text" id="flow-name-sel" class="smarthire-input" value="${activeFlow.nameSelector}" placeholder="e.g. .candidate-name" />
                <button type="button" class="smarthire-btn-pick" data-target="flow-name-sel">🎯 Pick</button>
              </div>
            </div>

            <!-- Field 5: Contact / Email Selector -->
            <div class="smarthire-field-row">
              <div class="smarthire-field-label-group">
                <span class="smarthire-field-label">5. Contact / Email Selector</span>
              </div>
              <div class="smarthire-input-pick-group">
                <input type="text" id="flow-email-sel" class="smarthire-input" value="${activeFlow.emailSelector}" placeholder="e.g. #contact-legend-detail" />
                <button type="button" class="smarthire-btn-pick" data-target="flow-email-sel">🎯 Pick</button>
              </div>
            </div>

            <!-- Field 6: Phone Selector -->
            <div class="smarthire-field-row">
              <div class="smarthire-field-label-group">
                <span class="smarthire-field-label">6. Phone Selector</span>
              </div>
              <div class="smarthire-input-pick-group">
                <input type="text" id="flow-phone-sel" class="smarthire-input" value="${activeFlow.phoneSelector}" placeholder="e.g. #contact-legend-detail" />
                <button type="button" class="smarthire-btn-pick" data-target="flow-phone-sel">🎯 Pick</button>
              </div>
            </div>

            <!-- Field 7: Delay -->
            <div class="smarthire-field-row">
              <div class="smarthire-field-label-group">
                <span class="smarthire-field-label">7. Wait Delay Between Clicks (ms)</span>
              </div>
              <input type="number" id="flow-delay-val" class="smarthire-input" value="${activeFlow.delayMs || 500}" min="200" max="3000" step="100" />
            </div>

            <!-- Flow Buttons -->
            <div style="display:flex; gap:6px; margin-top:10px;">
              <button type="button" class="smarthire-btn-secondary" id="flow-btn-save" style="flex:1; margin-top:0;">
                💾 Save Flow
              </button>
              <button type="button" class="smarthire-btn-primary" id="flow-btn-run" style="flex:1.5; margin-top:0; background:#059669;">
                ▶ Run Workflow
              </button>
            </div>
            
            <div id="flow-run-status" style="margin-top:8px; font-size:11px; color:#64748B; text-align:center; font-weight:500; min-height:18px;">
              Configure or pick selectors on page, then click Run Workflow
            </div>
          </div>
        </div>

        <!-- SHARED RESULTS CARD (Excel Spreadsheet View) -->
        <div id="smarthire-results-card" class="smarthire-card" style="display:none;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <label class="smarthire-label" style="margin-bottom:0;">
              Extracted Candidates (<span id="smarthire-count">0</span>)
            </label>
            <span id="smarthire-portal-tag" style="background:#EFF6FF; color:#1D4ED8; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; text-transform:uppercase;">MONSTER+</span>
          </div>

          <div id="smarthire-candidate-preview-list" style="max-height:220px; overflow-y:auto; border:1px solid #E2E8F0; border-radius:6px; background:#FFFFFF; margin-bottom:10px;">
          </div>

          <button id="smarthire-btn-ai-match" class="smarthire-btn-primary" style="background:#7C3AED; margin-bottom:6px; display:flex; align-items:center; justify-content:center; gap:6px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
            <span id="smarthire-ai-match-btn-text">⚡ Run AI Resume Fit Match</span>
          </button>
          <button id="smarthire-btn-copy-tsv" class="smarthire-btn-secondary" style="margin-bottom:6px;">
            📋 Copy to Clipboard (Excel TSV Format)
          </button>
          <button id="smarthire-btn-bulk-outreach" class="smarthire-btn-primary" style="background:#2563EB; margin-bottom:6px; display:flex; align-items:center; justify-content:center; gap:6px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span>✉ Bulk Send JD Email to Selected (<span id="smarthire-bulk-count">0</span>)</span>
          </button>
          <button id="smarthire-btn-import-ats" class="smarthire-btn-primary" style="background:#059669;">
            🚀 1-Click Import to SmartHire ATS
          </button>
          <div id="smarthire-import-msg" style="margin-top:6px; font-size:11px; text-align:center; font-weight:600;"></div>
        </div>

      </div>
    `;

    document.body.appendChild(trigger);
    document.body.appendChild(drawer);

    // Initial setup
    updateJobDisplay();
    updateContainerCountBadge();

    // Event Listeners: Trigger & Drawer Close
    trigger.addEventListener('click', () => {
      drawer.classList.add('open');
    });

    document.getElementById('smarthire-drawer-close').addEventListener('click', () => {
      drawer.classList.remove('open');
    });

    // Tab Navigation
    const tabQuick = document.getElementById('tab-btn-quick');
    const tabFlow = document.getElementById('tab-btn-flow');
    const viewQuick = document.getElementById('view-quick-sourcing');
    const viewFlow = document.getElementById('view-flow-studio');

    tabQuick.addEventListener('click', () => {
      tabQuick.classList.add('active');
      tabFlow.classList.remove('active');
      viewQuick.style.display = 'block';
      viewFlow.style.display = 'none';
    });

    tabFlow.addEventListener('click', () => {
      tabFlow.classList.add('active');
      tabQuick.classList.remove('active');
      viewQuick.style.display = 'none';
      viewFlow.style.display = 'block';
      updateContainerCountBadge();
    });

    // Instant filter for Requisitions
    const filterInput = document.getElementById('smarthire-req-filter');
    filterInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        filteredJobs = [...allJobs];
      } else {
        filteredJobs = allJobs.filter(j => {
          const t = (j.title || '').toLowerCase();
          const id = String(j.id || j.reqId || '').toLowerCase();
          const l = (j.location || '').toLowerCase();
          const s = (Array.isArray(j.skills) ? j.skills.join(' ') : String(j.skills || '')).toLowerCase();
          return t.includes(q) || id.includes(q) || l.includes(q) || s.includes(q);
        });
      }
      renderJobsSelect(true);
    });

    // Requisition dropdown select
    document.getElementById('smarthire-req-select').addEventListener('change', (e) => {
      const val = e.target.value;
      selectedJob = allJobs.find(j => String(j.id || j.reqId) === String(val)) || null;
      updateJobDisplay();
    });

    // Auto-fill Search Button
    document.getElementById('smarthire-btn-autosearch').addEventListener('click', (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!selectedJob) return;
      const title = (selectedJob.title || '').replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
      const skillsQuery = generateBooleanQuery(selectedJob);
      const loc = selectedJob.location || '';
      const status = document.getElementById('smarthire-scrape-status');

      if (typeof window.smartHireAutoFillSearch === 'function') {
        const resMsg = window.smartHireAutoFillSearch({
          title,
          skillsQuery,
          query: skillsQuery,
          location: loc
        });
        status.innerText = resMsg || 'Search parameters injected into Monster+!';
      }
    });

    // Quick 1-Click Scrape
    document.getElementById('smarthire-btn-scrape').addEventListener('click', (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      runQuickScrape();
    });

    // Workflow Studio Presets
    document.getElementById('preset-monster').addEventListener('click', () => {
      applyPreset({
        containerSelector: '.smui-card',
        clickSelector: '.smui-card-body',
        tabSelector: '.tab__label',
        nameSelector: '.candidate-name, a[href*="/candidate/"], h2, h3',
        emailSelector: '#contact-legend-detail',
        phoneSelector: '#contact-legend-detail',
        delayMs: 800
      });
    });

    document.getElementById('preset-dice').addEventListener('click', () => {
      applyPreset({
        containerSelector: '[data-testid="search-card"], [class*="CandidateCard"], article',
        clickSelector: 'a[href*="/candidates/"]',
        tabSelector: '',
        nameSelector: '[data-testid="candidate-name"], h5, h4',
        emailSelector: 'a[href^="mailto:"]',
        phoneSelector: 'a[href^="tel:"]',
        delayMs: 600
      });
    });

    document.getElementById('preset-reset').addEventListener('click', () => {
      applyPreset({
        containerSelector: 'smui-card',
        clickSelector: 'div',
        tabSelector: '',
        nameSelector: 'h2, h3, [class*="name"]',
        emailSelector: '#contact-legend-detail',
        phoneSelector: '#contact-legend-detail',
        delayMs: 500
      });
    });

    // Visual Pick Buttons
    drawer.querySelectorAll('.smarthire-btn-pick').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetInputId = btn.getAttribute('data-target');
        startVisualElementPicker(targetInputId);
      });
    });

    // Save Flow Button
    document.getElementById('flow-btn-save').addEventListener('click', () => {
      saveActiveFlowFromInputs();
      const st = document.getElementById('flow-run-status');
      st.style.color = '#059669';
      st.innerText = '✓ Workflow saved successfully!';
      setTimeout(() => { st.innerText = 'Ready to run workflow'; }, 2500);
    });

    // Run Flow Button
    document.getElementById('flow-btn-run').addEventListener('click', () => {
      runFlowStudioWorkflow();
    });

    // Copy TSV
    document.getElementById('smarthire-btn-copy-tsv').addEventListener('click', () => {
      copyCandidatesToClipboard();
    });

    // ATS Import
    document.getElementById('smarthire-btn-import-ats').addEventListener('click', () => {
      importToSmartHireAts();
    });

    // Bulk Outreach Button
    document.getElementById('smarthire-btn-bulk-outreach')?.addEventListener('click', () => {
      openBulkComposer();
    });

    // AI Fit Match Button
    document.getElementById('smarthire-btn-ai-match')?.addEventListener('click', () => {
      runAiFitAnalysis();
    });

    // Refresh Jobs Button
    document.getElementById('smarthire-refresh-jobs')?.addEventListener('click', () => {
      fetchLiveJobs();
    });

    // Recruiter Auth Toggle (Sign Out or Focus Login)
    document.getElementById('smarthire-btn-auth-toggle')?.addEventListener('click', () => {
      if (isUserAuthenticated && currentUser) {
        if (confirm(`Sign out of SmartHire ATS (${currentUser.name})?`)) {
          chrome.runtime.sendMessage({ action: 'LOGOUT_USER' }, () => {
            currentUser = null;
            isUserAuthenticated = false;
            try {
              localStorage.removeItem('smarthire_user_cached');
              localStorage.removeItem('smarthire_token_cached');
            } catch (_) {}
            updateRecruiterBarUI();
            checkAndApplyAuthGate();
          });
        }
      } else {
        const emailInput = document.getElementById('smarthire-gate-email');
        if (emailInput) {
          emailInput.focus();
          emailInput.style.borderColor = '#3B82F6';
          emailInput.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.25)';
          setTimeout(() => {
            emailInput.style.borderColor = '';
            emailInput.style.boxShadow = '';
          }, 1500);
        }
      }
    });

    // Auth Lock Gate Login Button & Keyboard Enter Handlers
    document.getElementById('smarthire-gate-btn-login')?.addEventListener('click', () => {
      performGateLogin();
    });

    document.getElementById('smarthire-gate-pass')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performGateLogin();
    });

    document.getElementById('smarthire-gate-email')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const pass = document.getElementById('smarthire-gate-pass');
        if (pass && !pass.value) {
          pass.focus();
        } else {
          performGateLogin();
        }
      }
    });

    // Mount Outreach, Bulk Composer, and AI Dossier Modal Overlays in DOM
    initOutreachComposerModal();
    initBulkComposerModal();
    initAiDossierModal();

    // Auto-fetch fresh live jobs & recruiter identity on mount
    fetchCurrentUser();
    fetchLiveJobs();
  }

  function checkAndApplyAuthGate() {
    const gate = document.getElementById('smarthire-auth-gate');
    const quickView = document.getElementById('view-quick-sourcing');
    const flowView = document.getElementById('view-flow-studio');
    const resultsCard = document.getElementById('smarthire-results-card');
    const navTabs = document.querySelector('.smarthire-nav-tabs');

    if (!isUserAuthenticated || !currentUser) {
      if (gate) gate.style.display = 'block';
      if (quickView) quickView.style.display = 'none';
      if (flowView) flowView.style.display = 'none';
      if (resultsCard) resultsCard.style.display = 'none';
      if (navTabs) navTabs.style.display = 'none';
    } else {
      if (gate) gate.style.display = 'none';
      if (quickView) quickView.style.display = 'block';
      if (navTabs) navTabs.style.display = 'flex';
      if (scrapedCandidates.length > 0 && resultsCard) resultsCard.style.display = 'block';
    }
  }

  function updateRecruiterBarUI() {
    const nameEl = document.getElementById('smarthire-recruiter-name-label');
    const emailEl = document.getElementById('smarthire-recruiter-email-label');
    const toggleBtn = document.getElementById('smarthire-btn-auth-toggle');
    if (isUserAuthenticated && currentUser) {
      if (nameEl) nameEl.innerText = currentUser.name || 'Recruiter';
      if (emailEl) emailEl.innerText = `(${currentUser.email})`;
      if (toggleBtn) {
        toggleBtn.innerText = 'Sign Out';
        toggleBtn.style.color = '#F87171';
      }
    } else {
      if (nameEl) nameEl.innerText = 'Not Signed In';
      if (emailEl) emailEl.innerText = '(Login Required)';
      if (toggleBtn) {
        toggleBtn.innerText = 'Sign In';
        toggleBtn.style.color = '#38BDF8';
      }
    }
  }

  function fetchCurrentUser() {
    // 1. Direct check of chrome.storage.local (shared across Monster, Dice, and Popup)
    try {
      if (chrome?.storage?.local) {
        chrome.storage.local.get(['smarthire_user', 'smarthire_token'], (stored) => {
          if (stored && stored.smarthire_user && stored.smarthire_user.email) {
            currentUser = stored.smarthire_user;
            isUserAuthenticated = true;
            try {
              localStorage.setItem('smarthire_user_cached', JSON.stringify(currentUser));
              localStorage.setItem('smarthire_token_cached', stored.smarthire_token || '');
            } catch (_) {}
            updateRecruiterBarUI();
            checkAndApplyAuthGate();
            return;
          }

          // Fallback only if chrome.storage.local did NOT contain active user
          fallbackUserCheck();
        });
        return;
      }
    } catch (_) {}

    fallbackUserCheck();

    function fallbackUserCheck() {
      // 2. Check localStorage fallback (origin-local)
      try {
        const cached = localStorage.getItem('smarthire_user_cached');
        if (cached) {
          const u = JSON.parse(cached);
          if (u && u.email) {
            currentUser = u;
            isUserAuthenticated = true;
            try {
              if (chrome?.storage?.local) {
                chrome.storage.local.set({
                  smarthire_user: u,
                  smarthire_token: localStorage.getItem('smarthire_token_cached') || '',
                  recruiter_email: u.email,
                  recruiter_name: u.name
                });
              }
            } catch (_) {}
            updateRecruiterBarUI();
            checkAndApplyAuthGate();
            return;
          }
        }
      } catch (_) {}

      // 3. Fallback via background service worker relay
      try {
        chrome.runtime.sendMessage({ action: 'GET_CURRENT_USER' }, (res) => {
          if (chrome.runtime.lastError) {
            if (!currentUser) {
              currentUser = null;
              isUserAuthenticated = false;
              updateRecruiterBarUI();
              checkAndApplyAuthGate();
            }
            return;
          }
          if (res && res.success && res.user && res.user.email) {
            currentUser = res.user;
            isUserAuthenticated = true;
            try {
              localStorage.setItem('smarthire_user_cached', JSON.stringify(currentUser));
              localStorage.setItem('smarthire_token_cached', res.token || '');
            } catch (_) {}
            try {
              if (chrome?.storage?.local) {
                chrome.storage.local.set({
                  smarthire_user: currentUser,
                  smarthire_token: res.token || '',
                  recruiter_email: currentUser.email,
                  recruiter_name: currentUser.name
                });
              }
            } catch (_) {}
          } else if (!currentUser) {
            currentUser = null;
            isUserAuthenticated = false;
          }
          updateRecruiterBarUI();
          checkAndApplyAuthGate();
        });
      } catch (e) {
        if (!currentUser) {
          currentUser = null;
          isUserAuthenticated = false;
          updateRecruiterBarUI();
          checkAndApplyAuthGate();
        }
      }
    }
  }

  // Real-time synchronization across all tabs (Monster <-> Dice <-> Popup)
  try {
    if (chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.smarthire_user) {
          if (changes.smarthire_user.newValue && changes.smarthire_user.newValue.email) {
            currentUser = changes.smarthire_user.newValue;
            isUserAuthenticated = true;
            try { localStorage.setItem('smarthire_user_cached', JSON.stringify(currentUser)); } catch (_) {}
          } else {
            currentUser = null;
            isUserAuthenticated = false;
            try { localStorage.removeItem('smarthire_user_cached'); } catch (_) {}
          }
          updateRecruiterBarUI();
          checkAndApplyAuthGate();
        }
      });
    }
  } catch (_) {}

  function performGateLogin() {
    const email = document.getElementById('smarthire-gate-email')?.value.trim();
    const password = document.getElementById('smarthire-gate-pass')?.value.trim();
    const statusEl = document.getElementById('smarthire-gate-status');
    const btn = document.getElementById('smarthire-gate-btn-login');

    if (!email || !password) {
      if (statusEl) {
        statusEl.style.color = '#DC2626';
        statusEl.innerText = 'Please enter both your work email and password';
      }
      return;
    }

    const resetButton = () => {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          <span>Sign In to SmartHire Copilot</span>
        `;
      }
    };

    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Signing In...';
    }
    if (statusEl) {
      statusEl.style.color = '#2563EB';
      statusEl.innerText = 'Authenticating with SmartHire ATS...';
    }

    let responded = false;

    const handleSuccess = (user, token) => {
      if (responded) return;
      responded = true;
      currentUser = user;
      isUserAuthenticated = true;
      try {
        localStorage.setItem('smarthire_user_cached', JSON.stringify(user));
        localStorage.setItem('smarthire_token_cached', token || '');
      } catch (_) {}

      try {
        if (chrome?.storage?.local) {
          chrome.storage.local.set({
            smarthire_user: user,
            smarthire_token: token || '',
            recruiter_email: user.email,
            recruiter_name: user.name
          });
        }
      } catch (_) {}

      resetButton();
      if (statusEl) {
        statusEl.style.color = '#059669';
        statusEl.innerText = `✓ Welcome, ${user.name || 'Recruiter'}!`;
      }
      updateRecruiterBarUI();
      setTimeout(() => {
        checkAndApplyAuthGate();
      }, 400);
    };

    const handleFailure = (msg) => {
      if (responded) return;
      responded = true;
      resetButton();
      if (statusEl) {
        statusEl.style.color = '#DC2626';
        statusEl.innerText = msg || 'Invalid email or password. Please verify credentials.';
      }
    };

    // Strategy 1 (Primary): Extension Service Worker Relay (Bypasses Dice/Monster CSP, CORS & page interceptors)
    try {
      chrome.runtime.sendMessage({ action: 'LOGIN_USER', email, password }, (res) => {
        if (chrome.runtime.lastError) {
          console.warn('[SmartHire Dock] Background login lastError:', chrome.runtime.lastError.message);
          tryDirectFetch();
          return;
        }
        if (res && res.success && res.user) {
          handleSuccess(res.user, res.token);
        } else {
          handleFailure(res?.message || 'Invalid email or password. Please check your credentials.');
        }
      });
    } catch (e) {
      console.warn('[SmartHire Dock] Background sendMessage exception:', e);
      tryDirectFetch();
    }

    // Strategy 2 (Secondary Fallback): Direct fetch to ATS server with timeout controller
    function tryDirectFetch() {
      if (responded) return;
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), 18000);

      fetch('https://smarthireus.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      })
        .then(res => res.json())
        .then(data => {
          clearTimeout(abortTimer);
          if (data && data.success && data.user) {
            handleSuccess(data.user, data.token);
          } else {
            handleFailure(data?.message || 'Invalid email or password');
          }
        })
        .catch(err => {
          clearTimeout(abortTimer);
          if (!responded) {
            handleFailure(err.name === 'AbortError' ? 'Server connection timed out. Please check network.' : 'Unable to connect to SmartHire ATS. Please refresh the page.');
          }
        });
    }

    // Safety timeout: 22 seconds (allows for server cron spikes or high network latency)
    setTimeout(() => {
      if (!responded) {
        handleFailure('Authentication timed out. Please check your connection or refresh the page.');
      }
    }, 22000);
  }

  function initOutreachComposerModal() {
    if (document.getElementById('smarthire-composer-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'smarthire-composer-overlay';
    overlay.style.display = 'none';
    overlay.innerHTML = `
      <div id="smarthire-composer-modal">
        <div class="smarthire-composer-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" stroke-width="2.2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span style="font-weight:700; font-size:13.5px; color:#FFFFFF;">Compose JD Outreach Email</span>
          </div>
          <button id="smarthire-composer-close" style="background:none; border:none; color:#94A3B8; font-size:22px; cursor:pointer; line-height:1; padding:0 4px;">&times;</button>
        </div>
        <div class="smarthire-composer-body">
          <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:6px; padding:7px 10px; font-size:11px; color:#1E40AF; display:flex; justify-content:space-between; align-items:center;">
            <span>Sending as: <strong id="smarthire-comp-sender-label"></strong></span>
            <span style="color:#059669; font-size:10px; font-weight:700; background:#ECFDF5; border:1px solid #A7F3D0; padding:1px 6px; border-radius:3px;">No Rate · No Req #</span>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
            <div class="smarthire-composer-field">
              <label>Candidate Name</label>
              <input type="text" id="smarthire-comp-cand-name" />
            </div>
            <div class="smarthire-composer-field">
              <label>Candidate Email</label>
              <input type="email" id="smarthire-comp-cand-email" />
            </div>
          </div>
          <div class="smarthire-composer-field">
            <label>Position Title (Clean Name Only)</label>
            <input type="text" id="smarthire-comp-job-title" />
          </div>
          <div class="smarthire-composer-field">
            <label>Subject Line</label>
            <input type="text" id="smarthire-comp-subject" />
          </div>
          <div class="smarthire-composer-field" style="flex:1;">
            <label>Email Message & Formatted JD (Fully Editable)</label>
            <textarea id="smarthire-comp-body" rows="12"></textarea>
          </div>
        </div>
        <div class="smarthire-composer-footer">
          <div id="smarthire-comp-status" style="font-size:11.5px; font-weight:600; min-height:18px;"></div>
          <div style="display:flex; gap:8px;">
            <button type="button" id="smarthire-comp-cancel" class="smarthire-btn-secondary" style="margin:0; font-size:11.5px; padding:6px 14px;">Cancel</button>
            <button type="button" id="smarthire-comp-send" class="smarthire-btn-primary" style="margin:0; font-size:11.5px; padding:6px 16px; background:#2563EB;">Send Outreach Email</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Event Listeners for Composer
    document.getElementById('smarthire-composer-close')?.addEventListener('click', closeOutreachComposer);
    document.getElementById('smarthire-comp-cancel')?.addEventListener('click', closeOutreachComposer);
    document.getElementById('smarthire-comp-send')?.addEventListener('click', sendOutreachEmailFromComposer);

    // Close on background click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeOutreachComposer();
    });
  }

  function openOutreachComposer(candidate, job) {
    if (!candidate) return;
    activeOutreachCandidate = candidate;
    const targetJob = job || selectedJob;
    const draft = generateOutreachDraft(candidate, targetJob);

    initOutreachComposerModal();
    const overlay = document.getElementById('smarthire-composer-overlay');
    if (!overlay) return;

    const senderEl = document.getElementById('smarthire-comp-sender-label');
    if (senderEl) senderEl.innerText = `${currentUser.name} <${currentUser.email}>`;

    const nameInput = document.getElementById('smarthire-comp-cand-name');
    if (nameInput) nameInput.value = draft.candidateName;

    const emailInput = document.getElementById('smarthire-comp-cand-email');
    if (emailInput) emailInput.value = draft.to;

    const titleInput = document.getElementById('smarthire-comp-job-title');
    if (titleInput) titleInput.value = draft.cleanTitle;

    const subjInput = document.getElementById('smarthire-comp-subject');
    if (subjInput) subjInput.value = draft.subject;

    const bodyInput = document.getElementById('smarthire-comp-body');
    if (bodyInput) bodyInput.value = draft.body;

    const statusEl = document.getElementById('smarthire-comp-status');
    if (statusEl) statusEl.innerHTML = '';

    const sendBtn = document.getElementById('smarthire-comp-send');
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.innerText = 'Send Outreach Email';
    }

    overlay.style.display = 'flex';
  }

  function closeOutreachComposer() {
    const overlay = document.getElementById('smarthire-composer-overlay');
    if (overlay) overlay.style.display = 'none';
    activeOutreachCandidate = null;
  }

  function sendOutreachEmailFromComposer() {
    const to = document.getElementById('smarthire-comp-cand-email')?.value.trim();
    const subject = document.getElementById('smarthire-comp-subject')?.value.trim();
    const body = document.getElementById('smarthire-comp-body')?.value.trim();
    const statusEl = document.getElementById('smarthire-comp-status');
    const sendBtn = document.getElementById('smarthire-comp-send');

    if (!to || !to.includes('@')) {
      if (statusEl) statusEl.innerHTML = '<span style="color:#DC2626;">Valid candidate email required</span>';
      return;
    }
    if (!subject || !body) {
      if (statusEl) statusEl.innerHTML = '<span style="color:#DC2626;">Subject and message body required</span>';
      return;
    }

    sendBtn.disabled = true;
    sendBtn.innerText = 'Sending Email...';
    if (statusEl) statusEl.innerHTML = `<span style="color:#2563EB;">Delivering email to ${to} via SMTP...</span>`;

    const emailPayload = {
      recruiterEmail: currentUser.email,
      recruiterName: currentUser.name,
      to,
      subject,
      body,
      html: body.replace(/\n/g, '<br>')
    };

    const handleSendResult = (res) => {
      if (res && res.success) {
        if (statusEl) statusEl.innerHTML = `<span style="color:#059669; font-weight:700;">✓ Email delivered successfully from ${currentUser.email}!</span>`;
        sentCandidateEmails.add(to.toLowerCase());
        if (activeOutreachCandidate) {
          sentCandidateEmails.add((activeOutreachCandidate.name || '').toLowerCase());
        }
        renderResults(scrapedCandidates);
        setTimeout(() => {
          closeOutreachComposer();
        }, 1800);
      } else {
        sendBtn.disabled = false;
        sendBtn.innerText = 'Retry Send';
        if (statusEl) statusEl.innerHTML = `<span style="color:#DC2626; font-weight:600;">Failed: ${res?.message || 'SMTP delivery rejected'}</span>`;
      }
    };

    function tryDirectSend() {
      fetch('https://smarthireus.com/api/recruiter/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      })
        .then(r => r.json())
        .then(handleSendResult)
        .catch(err => {
          sendBtn.disabled = false;
          sendBtn.innerText = 'Send Outreach Email';
          if (statusEl) statusEl.innerHTML = `<span style="color:#DC2626;">Error: ${err.message}</span>`;
        });
    }

    if (typeof chrome !== 'undefined' && chrome?.runtime?.id) {
      try {
        chrome.runtime.sendMessage({
          action: 'SEND_OUTREACH_EMAIL',
          payload: emailPayload
        }, (res) => {
          if (chrome.runtime.lastError) {
            tryDirectSend();
            return;
          }
          handleSendResult(res);
        });
      } catch (_) {
        tryDirectSend();
      }
    } else {
      tryDirectSend();
    }
  }

  function initBulkComposerModal() {
    if (document.getElementById('smarthire-bulk-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'smarthire-bulk-overlay';
    overlay.style.display = 'none';
    overlay.innerHTML = `
      <div id="smarthire-bulk-modal">
        <div class="smarthire-composer-header" style="background:#1E293B;">
          <div style="display:flex; align-items:center; gap:8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" stroke-width="2.2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span style="font-weight:700; font-size:13.5px; color:#FFFFFF;">Bulk JD Outreach Composer</span>
          </div>
          <button id="smarthire-bulk-close" style="background:none; border:none; color:#94A3B8; font-size:22px; cursor:pointer; line-height:1; padding:0 4px;">&times;</button>
        </div>
        <div class="smarthire-composer-body">
          <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:6px; padding:7px 10px; font-size:11px; color:#1E40AF; display:flex; justify-content:space-between; align-items:center;">
            <span>Sending as: <strong id="smarthire-bulk-sender-label"></strong></span>
            <span style="color:#059669; font-size:10px; font-weight:700; background:#ECFDF5; border:1px solid #A7F3D0; padding:1px 6px; border-radius:3px;">No Rate · No Req # · Dynamic {{firstName}}</span>
          </div>
          
          <div class="smarthire-composer-field">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <label>Target Recipients (<span id="smarthire-bulk-recipients-count">0</span> Candidates)</label>
              <span style="font-size:10px; color:#64748B;">Candidates with verified email addresses</span>
            </div>
            <div id="smarthire-bulk-recipients-chips" class="smarthire-chip-container"></div>
          </div>

          <div class="smarthire-composer-field">
            <label>Position Title (Clean Title Only)</label>
            <input type="text" id="smarthire-bulk-job-title" />
          </div>

          <div class="smarthire-composer-field">
            <label>Subject Line Template</label>
            <input type="text" id="smarthire-bulk-subject" />
          </div>

          <div class="smarthire-composer-field" style="flex:1;">
            <label>Message Body & Formatted JD Template (Fully Editable)</label>
            <textarea id="smarthire-bulk-body" rows="11" style="font-size:11.5px;"></textarea>
          </div>

          <div class="smarthire-progress-container" id="smarthire-bulk-progress-container">
            <div class="smarthire-progress-bar" id="smarthire-bulk-progress-bar"></div>
          </div>
          <div id="smarthire-bulk-live-log" style="font-size:11px; color:#64748B; max-height:48px; overflow-y:auto; line-height:1.4;"></div>
        </div>
        <div class="smarthire-composer-footer">
          <div id="smarthire-bulk-status" style="font-size:11.5px; font-weight:600; min-height:18px;"></div>
          <div style="display:flex; gap:8px;">
            <button type="button" id="smarthire-bulk-cancel" class="smarthire-btn-secondary" style="margin:0; font-size:11.5px; padding:6px 14px;">Cancel</button>
            <button type="button" id="smarthire-bulk-send" class="smarthire-btn-primary" style="margin:0; font-size:11.5px; padding:6px 16px; background:#2563EB;">Send Bulk Emails</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('smarthire-bulk-close')?.addEventListener('click', closeBulkComposer);
    document.getElementById('smarthire-bulk-cancel')?.addEventListener('click', closeBulkComposer);
    document.getElementById('smarthire-bulk-send')?.addEventListener('click', sendBulkOutreachEmails);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeBulkComposer();
    });
  }

  function openBulkComposer() {
    if (!isUserAuthenticated || !currentUser) {
      alert('Authentication Required: Please sign in with your SmartHire ATS credentials to send bulk emails.');
      checkAndApplyAuthGate();
      return;
    }

    // Deduplicate valid candidates by email address so the recruiter never sends duplicates to the same address
    const emailMap = new Map();
    scrapedCandidates.forEach((c, i) => {
      if (selectedCandidateIndices.size > 0 && !selectedCandidateIndices.has(i)) return;
      const em = (c.email || '').trim().toLowerCase();
      if (!em || !em.includes('@') || em.includes('@monster.talent') || em === 'not disclosed') return;
      if (!emailMap.has(em)) {
        emailMap.set(em, c);
      }
    });

    const validCandidates = Array.from(emailMap.values());

    if (validCandidates.length === 0) {
      alert('Please select at least one candidate with a valid email address.');
      return;
    }

    initBulkComposerModal();
    const overlay = document.getElementById('smarthire-bulk-overlay');
    if (!overlay) return;

    const senderEl = document.getElementById('smarthire-bulk-sender-label');
    if (senderEl) senderEl.innerText = `${currentUser.name} <${currentUser.email}>`;

    const countEl = document.getElementById('smarthire-bulk-recipients-count');
    if (countEl) countEl.innerText = `${validCandidates.length} Unique Verified`;

    const chipsContainer = document.getElementById('smarthire-bulk-recipients-chips');
    if (chipsContainer) {
      chipsContainer.innerHTML = validCandidates.map(c => `
        <span class="smarthire-chip-tag" title="${c.email}">
          ${c.name} &lt;${c.email}&gt;
        </span>
      `).join('');
    }

    const cleanTitle = cleanJobTitle(selectedJob ? selectedJob.title : 'Technical Specialist');
    let outreachData = null;
    if (window.SmartHireMatchingEngine && typeof window.SmartHireMatchingEngine.formatJobDescriptionForOutreach === 'function') {
      outreachData = window.SmartHireMatchingEngine.formatJobDescriptionForOutreach(selectedJob, '{{firstName}}', currentUser || {});
    }

    const titleInput = document.getElementById('smarthire-bulk-job-title');
    if (titleInput) titleInput.value = cleanTitle;

    const subjInput = document.getElementById('smarthire-bulk-subject');
    if (subjInput) subjInput.value = outreachData?.subject || `Direct Client: ${cleanTitle} — COOLSOFT LLC`;

    const bodyInput = document.getElementById('smarthire-bulk-body');
    if (bodyInput) {
      bodyInput.value = outreachData?.body || `Hi {{firstName}},

I hope this email finds you well.

COOLSOFT LLC has an immediate opening for a ${cleanTitle} role that aligns closely with your expertise. Below is the position summary for your review:

==================================================
POSITION OVERVIEW
==================================================
• Role: ${cleanTitle}
• Location: ${selectedJob?.location || 'United States'}
• Work Authorization: US Citizen / Green Card / Authorized to Work in US

If you are open to exploring this opportunity, please reply to this email with your updated resume, or let me know a convenient time for a brief introductory call.

Best regards,

${currentUser.name}
Technical Recruiter | COOLSOFT LLC
Email: ${currentUser.email}
Website: http://www.coolsofttech.com`;
    }

    const progContainer = document.getElementById('smarthire-bulk-progress-container');
    if (progContainer) progContainer.style.display = 'none';

    const liveLog = document.getElementById('smarthire-bulk-live-log');
    if (liveLog) liveLog.innerHTML = '';

    const statusEl = document.getElementById('smarthire-bulk-status');
    if (statusEl) statusEl.innerHTML = '';

    const sendBtn = document.getElementById('smarthire-bulk-send');
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.innerText = `Send Bulk Emails (${validCandidates.length})`;
    }

    overlay.style.display = 'flex';
  }

  function closeBulkComposer() {
    const overlay = document.getElementById('smarthire-bulk-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  async function sendBulkOutreachEmails() {
    if (!isUserAuthenticated || !currentUser) {
      alert('Authentication required.');
      return;
    }

    const emailMap = new Map();
    scrapedCandidates.forEach((c, i) => {
      if (selectedCandidateIndices.size > 0 && !selectedCandidateIndices.has(i)) return;
      const em = (c.email || '').trim().toLowerCase();
      if (!em || !em.includes('@') || em.includes('@monster.talent') || em === 'not disclosed') return;
      if (!emailMap.has(em)) {
        emailMap.set(em, c);
      }
    });

    const validCandidates = Array.from(emailMap.values());

    if (validCandidates.length === 0) return;

    const subjectTemplate = document.getElementById('smarthire-bulk-subject')?.value.trim();
    const bodyTemplate = document.getElementById('smarthire-bulk-body')?.value.trim();
    const statusEl = document.getElementById('smarthire-bulk-status');
    const sendBtn = document.getElementById('smarthire-bulk-send');
    const progContainer = document.getElementById('smarthire-bulk-progress-container');
    const progBar = document.getElementById('smarthire-bulk-progress-bar');
    const liveLog = document.getElementById('smarthire-bulk-live-log');

    if (!subjectTemplate || !bodyTemplate) {
      if (statusEl) statusEl.innerHTML = '<span style="color:#DC2626;">Subject and message template required</span>';
      return;
    }

    sendBtn.disabled = true;
    if (progContainer) progContainer.style.display = 'block';

    let successCount = 0;
    let duplicateCount = 0;
    let failCount = 0;

    for (let i = 0; i < validCandidates.length; i++) {
      const cand = validCandidates[i];
      const firstName = (cand.name || 'there').split(' ')[0] || 'there';
      const personalizedBody = bodyTemplate.replace(/\{\{firstName\}\}/g, firstName);

      sendBtn.innerText = `Sending ${i + 1} of ${validCandidates.length}...`;
      const pct = Math.round(((i + 1) / validCandidates.length) * 100);
      if (progBar) progBar.style.width = `${pct}%`;

      const itemEmailPayload = {
        recruiterEmail: currentUser.email,
        recruiterName: currentUser.name,
        to: cand.email,
        subject: subjectTemplate,
        body: personalizedBody,
        html: personalizedBody.replace(/\n/g, '<br>')
      };

      try {
        let res = null;
        if (typeof chrome !== 'undefined' && chrome?.runtime?.id) {
          try {
            res = await new Promise((resolve, reject) => {
              chrome.runtime.sendMessage({
                action: 'SEND_OUTREACH_EMAIL',
                payload: itemEmailPayload
              }, (response) => {
                if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
                else resolve(response);
              });
            });
          } catch (_) {}
        }

        if (!res) {
          try {
            const fetchRes = await fetch('https://smarthireus.com/api/recruiter/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(itemEmailPayload)
            });
            res = await fetchRes.json();
          } catch (_) {}
        }

        if (res && res.success) {
          if (res.deduplicated) {
            duplicateCount++;
            if (liveLog) {
              const row = document.createElement('div');
              row.style.color = '#F59E0B';
              row.innerText = `⚠ [${i+1}/${validCandidates.length}] Skipped duplicate email for ${cand.name} (${cand.email}) within 60s`;
              liveLog.appendChild(row);
              liveLog.scrollTop = liveLog.scrollHeight;
            }
          } else {
            successCount++;
            sentCandidateEmails.add(cand.email.toLowerCase());
            sentCandidateEmails.add((cand.name || '').toLowerCase());
            if (liveLog) {
              const row = document.createElement('div');
              row.style.color = '#059669';
              row.innerText = `✓ [${i+1}/${validCandidates.length}] Delivered to ${cand.name} (${cand.email})`;
              liveLog.appendChild(row);
              liveLog.scrollTop = liveLog.scrollHeight;
            }
          }
        } else {
          failCount++;
          if (liveLog) {
            const row = document.createElement('div');
            row.style.color = '#DC2626';
            row.innerText = `✗ [${i+1}/${validCandidates.length}] Failed for ${cand.name}: ${res?.message || 'Error'}`;
            liveLog.appendChild(row);
            liveLog.scrollTop = liveLog.scrollHeight;
          }
        }
      } catch (err) {
        failCount++;
      }

      // 350ms throttle delay
      await new Promise(r => setTimeout(r, 350));
    }

    if (statusEl) {
      statusEl.innerHTML = `<span style="color:#059669; font-weight:700;">✓ Dispatched: ${successCount} sent${duplicateCount > 0 ? `, ${duplicateCount} duplicate skipped` : ''}${failCount > 0 ? `, ${failCount} failed` : ''}</span>`;
    }
    sendBtn.innerText = 'Completed!';
    renderResults(scrapedCandidates);

    setTimeout(() => {
      closeBulkComposer();
    }, 2500);
  }

  // ============================================================================
  // AI CANDIDATE RESUME-TO-JD MATCHING & DOSSIER ENGINE (EXPERT ATS SPEC)
  // ============================================================================
  let activeDossierCandidate = null;

  function initAiDossierModal() {
    if (document.getElementById('smarthire-dossier-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'smarthire-dossier-overlay';
    overlay.style.display = 'none';
    overlay.innerHTML = `
      <div id="smarthire-dossier-modal" style="width:720px; max-width:95vw; max-height:92vh;">
        <div class="smarthire-composer-header" style="background:#0F172A; border-bottom:1px solid #1E293B; padding:10px 16px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2.2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
            <span style="font-weight:700; font-size:13.5px; color:#FFFFFF;">AI Candidate Fit Dossier & Resume Evaluation</span>
          </div>
          <button type="button" id="smarthire-dossier-close" class="smarthire-composer-close">&times;</button>
        </div>
        <div class="smarthire-composer-body" style="padding:14px; background:#F8FAFC; overflow-y:auto; max-height:calc(92vh - 120px); display:flex; flex-direction:column; gap:12px;">
          
          <!-- Top Candidate & Requisition Banner -->
          <div style="background:#FFFFFF; border:1px solid #CBD5E1; border-radius:8px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div style="flex:1; min-width:240px;">
              <div id="dossier-cand-name" style="font-size:16px; font-weight:800; color:#0F172A;">Candidate Name</div>
              <div id="dossier-cand-role" style="font-size:11.5px; color:#475569; margin-top:2px;">Role · Location · Visa</div>
              <div id="dossier-job-title" style="font-size:11.5px; color:#2563EB; font-weight:700; margin-top:4px;">Target: Job Title</div>
            </div>
            <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
              <div style="display:flex; align-items:baseline; gap:6px;">
                <span id="dossier-score-val" style="font-size:26px; font-weight:900; line-height:1; color:#059669;">--%</span>
                <span id="dossier-verdict-tag" style="font-size:11px; font-weight:800; padding:2px 8px; border-radius:12px; background:#DCFCE7; color:#15803D;">FIT</span>
              </div>
              <div id="dossier-recommendation-badge" style="font-size:10.5px; font-weight:800; padding:2px 8px; border-radius:4px; background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE;">
                RECOMMENDATION: SUBMIT
              </div>
            </div>
          </div>

          <!-- Metadata & Eligibility Indicator Bar -->
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:6px;">
            <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:6px; padding:6px 10px; font-size:11px;">
              <span style="color:#64748B; font-weight:600;">Confidence: </span>
              <strong id="dossier-meta-confidence" style="color:#0F172A;">High</strong>
            </div>
            <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:6px; padding:6px 10px; font-size:11px;">
              <span style="color:#64748B; font-weight:600;">Coverage: </span>
              <strong id="dossier-meta-coverage" style="color:#0F172A;">High</strong>
            </div>
            <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:6px; padding:6px 10px; font-size:11px; grid-column: span 2;">
              <span style="color:#64748B; font-weight:600;">Eligibility: </span>
              <strong id="dossier-meta-eligibility" style="color:#059669;">Eligible — Evidence Available</strong>
            </div>
          </div>

          <!-- Extraction Status & Re-Extract Action Bar -->
          <div id="dossier-extraction-status-bar" style="display:flex; justify-content:space-between; align-items:center; background:#F8FAFC; border:1px solid #CBD5E1; border-radius:6px; padding:7px 12px; font-size:11px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              <span id="dossier-extraction-badge" style="font-weight:700; color:#1E40AF;">FULL RESUME EXTRACTED</span>
              <span id="dossier-char-count" style="color:#64748B; font-size:10.5px;">(0 chars analyzed)</span>
            </div>
            <button type="button" id="dossier-btn-reextract" style="background:#2563EB; color:#FFFFFF; border:none; padding:4px 10px; font-size:10.5px; font-weight:700; border-radius:4px; cursor:pointer; display:flex; align-items:center; gap:4px; box-shadow:0 1px 3px rgba(37,99,235,0.2);">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              <span id="dossier-reextract-text">Re-Extract from Active Tab</span>
            </button>
          </div>

          <!-- Provisional Profile Warning Banner -->
          <div id="dossier-provisional-banner" style="display:none; padding:8px 12px; margin-bottom:10px; border-radius:6px; background:#FFFBEB; border:1px solid #FDE68A; font-size:11px; color:#92400E; font-weight:600;"></div>

          <!-- Executive Summary & Recruiter Rationale -->
          <div style="background:#FFFFFF; border:1px solid #CBD5E1; border-radius:8px; padding:12px;">
            <div style="font-size:11px; font-weight:800; color:#334155; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:5px;">
              Executive Recruiter Rationale & Fit Analysis
            </div>
            <div id="dossier-reasoning-text" style="font-size:12px; color:#1E293B; line-height:1.55;"></div>
            <div id="dossier-eligibility-notes" style="font-size:11px; color:#475569; margin-top:8px; padding-top:6px; border-top:1px dashed #E2E8F0;"></div>
          </div>

          <!-- Excel-Style Skills Match Grid (Rule 9 Compliant) -->
          <div style="background:#FFFFFF; border:1px solid #CBD5E1; border-radius:8px; padding:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <div style="font-size:11px; font-weight:800; color:#334155; text-transform:uppercase; letter-spacing:0.5px;">
                Structured Skills Match Matrix
              </div>
              <span style="font-size:10px; color:#64748B;">Evidence-Based Evaluation</span>
            </div>
            <div style="overflow-x:auto;">
              <table style="width:100%; border-collapse:collapse; border:1px solid #CBD5E1; font-size:11px;">
                <thead>
                  <tr style="background:#F1F5F9; color:#334155; font-weight:700; text-align:left;">
                    <th style="padding:6px 8px; border:1px solid #CBD5E1; width:22%;">Requirement</th>
                    <th style="padding:6px 8px; border:1px solid #CBD5E1; width:16%;">Category</th>
                    <th style="padding:6px 8px; border:1px solid #CBD5E1; width:18%;">Evidence Status</th>
                    <th style="padding:6px 8px; border:1px solid #CBD5E1;">Resume Evidence / Findings</th>
                  </tr>
                </thead>
                <tbody id="dossier-skills-table-body">
                  <!-- Dynamically populated rows -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- Strengths vs Gaps -->
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
            <!-- Strengths -->
            <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; padding:10px 12px;">
              <div style="font-size:10.5px; font-weight:800; color:#15803D; text-transform:uppercase; letter-spacing:0.4px; margin-bottom:5px; display:flex; align-items:center; gap:6px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Key Candidate Strengths</span>
              </div>
              <div id="dossier-strengths-box" style="display:flex; flex-direction:column; gap:4px; font-size:11px; color:#14532D; line-height:1.4;"></div>
            </div>

            <!-- Gaps / Risks -->
            <div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:8px; padding:10px 12px;">
              <div style="font-size:10.5px; font-weight:800; color:#B45309; text-transform:uppercase; letter-spacing:0.4px; margin-bottom:5px; display:flex; align-items:center; gap:6px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <span>Missing Gaps &amp; Verification Needs</span>
              </div>
              <div id="dossier-gaps-box" style="display:flex; flex-direction:column; gap:4px; font-size:11px; color:#78350F; line-height:1.4;"></div>
            </div>
          </div>

          <!-- Technical Interview Screening Questions -->
          <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:8px; padding:10px 12px;">
            <div style="font-size:10.5px; font-weight:800; color:#1D4ED8; text-transform:uppercase; letter-spacing:0.4px; margin-bottom:5px; display:flex; align-items:center; gap:6px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <span>Recommended Recruiter Screening Questions</span>
            </div>
            <div id="dossier-questions-box" style="display:flex; flex-direction:column; gap:5px; font-size:11px; color:#1E3A8A; line-height:1.45;"></div>
          </div>
        </div>

        <div class="smarthire-composer-footer" style="padding:10px 16px; background:#FFFFFF; border-top:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center;">
          <button type="button" id="dossier-footer-copy-report" style="margin:0; font-size:11.5px; padding:6px 14px; background:#F8FAFC; border:1px solid #CBD5E1; color:#334155; font-weight:700; border-radius:6px; display:flex; align-items:center; gap:5px; cursor:pointer;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span id="dossier-copy-btn-text">Copy Full AI Report</span>
          </button>
          <div style="display:flex; gap:8px;">
            <button type="button" id="dossier-footer-close" class="smarthire-btn-secondary" style="margin:0; font-size:11.5px; padding:6px 14px;">Close</button>
            <button type="button" id="dossier-footer-email" class="smarthire-btn-primary" style="margin:0; font-size:11.5px; padding:6px 16px; background:#2563EB; display:flex; align-items:center; gap:6px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span>Personalized JD Outreach ➔</span>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('smarthire-dossier-close')?.addEventListener('click', closeAiDossier);
    document.getElementById('dossier-footer-close')?.addEventListener('click', closeAiDossier);
    document.getElementById('dossier-footer-email')?.addEventListener('click', () => {
      const cand = activeDossierCandidate;
      closeAiDossier();
      if (cand) {
        openOutreachComposer(cand, selectedJob);
      }
    });

    document.getElementById('dossier-footer-copy-report')?.addEventListener('click', () => {
      const cand = activeDossierCandidate;
      if (!cand) return;
      const match = cand.aiMatch || {};
      const targetJob = selectedJob;

      const reqRows = (match.skillsMatchTable || []).map(r => 
        `| ${r.requirement} | ${r.category || 'Skill'} | ${r.classification || 'Mandatory'} | ${r.evidenceStatus} | ${r.resumeEvidence || 'None cited'} | ${r.gapOrQualification || 'None'} |`
      ).join('\n');

      const reportText = `# ATS Candidate Evaluation Dossier

Candidate: ${cand.name || 'Candidate'}
Role: ${cand.title || 'Specialist'}
Location: ${cand.location || 'United States'}
Work Authorization: ${cand.visaStatus || 'Authorized to Work in US'}
Target Requisition: ${cleanJobTitle(targetJob?.title || 'Open Position')}
Match Score: ${match.score ?? cand.matchScore ?? 75}% (${match.fitCategory || match.verdict || 'Fit'})
Recommendation: ${match.recommendation || 'Interview'}
Confidence: ${match.confidence || 'High'}
Coverage: ${match.evidenceCoverage || 'High'}
Eligibility: ${match.eligibilityStatus || 'Eligible — Evidence Available'}

---

## Executive Recruiter Rationale
${match.recommendationExplanation || match.reasoning || cand.aiReasoning || 'Evaluated against job description requirements.'}

Eligibility Notes:
${match.eligibilityNotes || 'Candidate profile aligns with target work location.'}

---

## Skills Match Matrix
| Requirement | Category | Type | Evidence Status | Resume Evidence | Gap / Notes |
|:---|:---|:---|:---|:---|:---|
${reqRows || '| Core Technical Requirements | Technical | Mandatory | DIRECT MATCH | Profile demonstrated | None |'}

---

## Key Candidate Strengths
${(match.strengths || cand.strengths || []).map(s => `• ${s}`).join('\n')}

## Identified Missing Gaps & Verification Needs
${(match.gaps || cand.gaps || []).map(g => `• ${g}`).join('\n')}

---

## Recommended Recruiter Screening Questions
${(match.interviewQuestions || [
  'Can you detail your specific technical contributions in your recent project?',
  'How do your core skills align with this position deliverables?'
]).map((q, idx) => `Q${idx + 1}: ${q}`).join('\n\n')}
`;

      navigator.clipboard.writeText(reportText).then(() => {
        const btnText = document.getElementById('dossier-copy-btn-text');
        if (btnText) {
          const orig = btnText.innerText;
          btnText.innerText = '✓ Copied Full Report!';
          setTimeout(() => { btnText.innerText = orig; }, 2500);
        }
      }).catch(err => {
        console.warn('Clipboard copy failed:', err);
      });
    });

    // Re-Extract Resume from Active Tab / Drawer Listener
    document.getElementById('dossier-btn-reextract')?.addEventListener('click', async () => {
      const cand = activeDossierCandidate;
      if (!cand) return;
      const reextractBtn = document.getElementById('dossier-btn-reextract');
      const reextractText = document.getElementById('dossier-reextract-text');
      if (reextractBtn) reextractBtn.disabled = true;
      if (reextractText) reextractText.innerText = 'Extracting full resume...';

      let extResult = null;
      if (typeof window.extractCleanMonsterResumeTextAsync === 'function' && window.location.hostname.includes('monster.com')) {
        let targetCard = null;
        if (typeof window.findMonsterCardByName === 'function') {
          targetCard = window.findMonsterCardByName(cand.name);
        }
        extResult = await window.extractCleanMonsterResumeTextAsync(targetCard, cand.name, true);
      } else if (typeof window.extractCleanDiceResumeText === 'function') {
        if (typeof window.extractDiceCandidateEmailAsync === 'function' && (!cand.email || !cand.email.includes('@'))) {
          const diceEmail = await window.extractDiceCandidateEmailAsync();
          if (diceEmail) {
            cand.email = diceEmail;
          }
        }
        const text = window.extractCleanDiceResumeText();
        extResult = {
          text,
          rawLength: text.length,
          sourceType: text.length >= 800 ? 'RESUME_DOCUMENT' : (text.length >= 150 ? 'PROFILE_SNIPPET' : 'NONE'),
          isProvisional: text.length < 800
        };
      } else if (typeof window.extractCleanMonsterResumeText === 'function') {
        const text = window.extractCleanMonsterResumeText(null, cand.name);
        extResult = {
          text,
          rawLength: text.length,
          sourceType: text.length >= 800 ? 'RESUME_DOCUMENT' : (text.length >= 150 ? 'SEARCH_CARD_SNIPPET' : 'NONE'),
          isProvisional: text.length < 800
        };
      }

      const liveResumeText = extResult?.text || '';

      if (liveResumeText && liveResumeText.length >= 150) {
        cand.resumeText = liveResumeText;
        cand.summary = liveResumeText.slice(0, 5000);
        cand.resumeSourceType = extResult?.sourceType || (liveResumeText.length >= 1200 ? 'RESUME_DOCUMENT' : (liveResumeText.length >= 250 ? 'PROFILE_SNIPPET' : 'SEARCH_CARD_SNIPPET'));

        // Auto-backfill verified contact info and location from full resume
        if (!cand.email || cand.email === 'Not Disclosed' || cand.email.includes('coolsofttech') || cand.email.includes('smarthireus')) {
          const freshEmail = (window.SmartHireUtils && typeof window.SmartHireUtils.extractCandidateEmail === 'function')
            ? window.SmartHireUtils.extractCandidateEmail(liveResumeText)
            : '';
          if (freshEmail && !freshEmail.includes('coolsofttech') && !freshEmail.includes('smarthireus')) {
            cand.email = freshEmail;
          }
        }
        if (!cand.phone || cand.phone === 'Not Disclosed' || cand.phone.length < 7) {
          const freshPhone = (window.SmartHireUtils && typeof window.SmartHireUtils.extractCandidatePhone === 'function')
            ? window.SmartHireUtils.extractCandidatePhone(liveResumeText)
            : '';
          if (freshPhone) cand.phone = freshPhone;
        }

        // Live Monster contact fallback
        if ((!cand.email || cand.email === 'Not Disclosed' || !cand.phone || cand.phone === 'Not Disclosed') && typeof window.extractMonsterContact === 'function') {
          try {
            const fresh = window.extractMonsterContact(null, cand.name);
            if ((!cand.email || cand.email === 'Not Disclosed') && fresh && fresh.email) cand.email = fresh.email;
            if ((!cand.phone || cand.phone === 'Not Disclosed') && fresh && fresh.phone) cand.phone = fresh.phone;
          } catch (e) {}
        }
        if (!cand.location || cand.location === 'United States') {
          const freshLoc = (typeof window.extractCleanMonsterLocation === 'function' ? window.extractCleanMonsterLocation(liveResumeText.slice(0, 2500)) : '') ||
                           (window.SmartHireUtils && typeof window.SmartHireUtils.extractLocation === 'function' ? window.SmartHireUtils.extractLocation(liveResumeText.slice(0, 2500)) : '');
          if (freshLoc) cand.location = freshLoc;
        }

        if (window.SmartHireMatchingEngine) {
          const v = window.SmartHireMatchingEngine.verifyAndClassifyResume(cand);
          cand.extractionStatus = v.status;
          cand.extractionVerification = v;
          cand.isProvisional = v.isProvisional;
          cand.resumeSourceType = v.sourceType;

          const targetJob = selectedJob;
          if (targetJob) {
            const norm = window.SmartHireMatchingEngine.normalizeJobDescription(targetJob);
            if (window.SmartHireMatchingEngine.sessionCache) {
              if (typeof window.SmartHireMatchingEngine.sessionCache.invalidateCandidate === 'function') {
                window.SmartHireMatchingEngine.sessionCache.invalidateCandidate(cand.id || cand.name);
              }
              if (window.SmartHireMatchingEngine.sessionCache.cache && typeof window.SmartHireMatchingEngine.sessionCache.cache.delete === 'function') {
                window.SmartHireMatchingEngine.sessionCache.cache.delete(`${cand.id}_${norm.title}`);
              }
            }
            const freshMatch = window.SmartHireMatchingEngine.sessionCache.getOrEvaluate(cand, norm, { forceRefresh: true });
            cand.aiMatch = freshMatch;
            cand.matchScore = freshMatch.score;
            cand.verdict = freshMatch.verdict;
            cand.fitCategory = freshMatch.fitCategory;
            cand.recommendation = freshMatch.recommendation;
            cand.eligibilityStatus = freshMatch.eligibilityStatus;
            cand.extractionStatus = freshMatch.extractionStatus;
            openAiDossier(cand, targetJob);
            renderResults(scrapedCandidates);
          }
        }

        const isActuallyFull = !cand.isProvisional && cand.extractionStatus === 'FULL_RESUME_EXTRACTED';

        if (isActuallyFull) {
          if (reextractText) reextractText.innerText = `✓ Full Resume Extracted (${liveResumeText.length.toLocaleString()} chars)`;
        } else {
          if (reextractText) reextractText.innerText = `Partial Extracted (${liveResumeText.length} chars) - Open Resume Tab`;
        }

        setTimeout(() => {
          if (reextractText) reextractText.innerText = 'Re-Extract from Active Tab';
          if (reextractBtn) reextractBtn.disabled = false;
        }, 3000);
      } else {
        if (reextractText) reextractText.innerText = 'No resume viewer detected. Open Resume tab';
        setTimeout(() => {
          if (reextractText) reextractText.innerText = 'Re-Extract from Active Tab';
          if (reextractBtn) reextractBtn.disabled = false;
        }, 3000);
      }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAiDossier();
    });
  }

  function openAiDossier(candidate, job) {
    if (!candidate) return;
    activeDossierCandidate = candidate;
    initAiDossierModal();

    const overlay = document.getElementById('smarthire-dossier-overlay');
    if (!overlay) return;

    const targetJob = job || selectedJob;

    // Auto-reconciliation with active right detail pane / drawer: If candidate has short/provisional text and active tab has full resume
    let liveResumeText = '';
    if (typeof window.extractCleanMonsterResumeText === 'function') {
      liveResumeText = window.extractCleanMonsterResumeText(null, candidate.name);
    } else if (typeof window.extractCleanDiceResumeText === 'function') {
      liveResumeText = window.extractCleanDiceResumeText();
    }
    const currentLen = (candidate.resumeText || '').length;
    if (liveResumeText && (liveResumeText.length > currentLen + 200 || (currentLen < 500 && liveResumeText.length >= 500))) {
      candidate.resumeText = liveResumeText;
      candidate.summary = liveResumeText.slice(0, 5000);
      candidate.resumeSourceType = liveResumeText.length >= 1200 ? 'RESUME_DOCUMENT' : (liveResumeText.length >= 250 ? 'PROFILE_SNIPPET' : 'SEARCH_CARD_SNIPPET');

      // Backfill contact details and location
      if (!candidate.email || candidate.email === 'Not Disclosed' || candidate.email.includes('coolsofttech') || candidate.email.includes('smarthireus')) {
        const freshEmail = (window.SmartHireUtils && typeof window.SmartHireUtils.extractCandidateEmail === 'function')
          ? window.SmartHireUtils.extractCandidateEmail(liveResumeText)
          : '';
        if (freshEmail && !freshEmail.includes('coolsofttech') && !freshEmail.includes('smarthireus')) {
          candidate.email = freshEmail;
        }
      }
      if (!candidate.phone || candidate.phone === 'Not Disclosed' || candidate.phone.length < 7) {
        const freshPhone = (window.SmartHireUtils && typeof window.SmartHireUtils.extractCandidatePhone === 'function')
          ? window.SmartHireUtils.extractCandidatePhone(liveResumeText)
          : '';
        if (freshPhone) candidate.phone = freshPhone;
      }

      // Live Monster contact fallback
      if ((!candidate.email || candidate.email === 'Not Disclosed' || !candidate.phone || candidate.phone === 'Not Disclosed') && typeof window.extractMonsterContact === 'function') {
        try {
          const fresh = window.extractMonsterContact(null, candidate.name);
          if ((!candidate.email || candidate.email === 'Not Disclosed') && fresh && fresh.email) candidate.email = fresh.email;
          if ((!candidate.phone || candidate.phone === 'Not Disclosed') && fresh && fresh.phone) candidate.phone = fresh.phone;
        } catch (e) {}
      }
      if (!candidate.location || candidate.location === 'United States') {
        const freshLoc = (typeof window.extractCleanMonsterLocation === 'function' ? window.extractCleanMonsterLocation(liveResumeText.slice(0, 2500)) : '') ||
                         (window.SmartHireUtils && typeof window.SmartHireUtils.extractLocation === 'function' ? window.SmartHireUtils.extractLocation(liveResumeText.slice(0, 2500)) : '');
        if (freshLoc) candidate.location = freshLoc;
      }

      if (window.SmartHireMatchingEngine && targetJob) {
        const v = window.SmartHireMatchingEngine.verifyAndClassifyResume(candidate);
        candidate.extractionStatus = v.status;
        candidate.extractionVerification = v;
        candidate.isProvisional = v.isProvisional;
        candidate.resumeSourceType = v.sourceType;
        const norm = window.SmartHireMatchingEngine.normalizeJobDescription(targetJob);
        if (window.SmartHireMatchingEngine.sessionCache) {
          if (typeof window.SmartHireMatchingEngine.sessionCache.invalidateCandidate === 'function') {
            window.SmartHireMatchingEngine.sessionCache.invalidateCandidate(candidate.id || candidate.name);
          }
          if (window.SmartHireMatchingEngine.sessionCache.cache && typeof window.SmartHireMatchingEngine.sessionCache.cache.delete === 'function') {
            window.SmartHireMatchingEngine.sessionCache.cache.delete(`${candidate.id}_${norm.title}`);
          }
        }
        candidate.aiMatch = window.SmartHireMatchingEngine.sessionCache.getOrEvaluate(candidate, norm, { forceRefresh: true });
        candidate.matchScore = candidate.aiMatch.score;
        candidate.verdict = candidate.aiMatch.verdict;
        candidate.fitCategory = candidate.aiMatch.fitCategory;
        candidate.recommendation = candidate.aiMatch.recommendation;
        candidate.eligibilityStatus = candidate.aiMatch.eligibilityStatus;
        candidate.extractionStatus = candidate.aiMatch.extractionStatus;
      }
    }

    let match = candidate.aiMatch;

    // Single Authoritative Engine Check: If candidate does not have an evaluation, evaluate once and cache
    if (!match && window.SmartHireMatchingEngine && targetJob) {
      const norm = window.SmartHireMatchingEngine.normalizeJobDescription(targetJob);
      match = window.SmartHireMatchingEngine.sessionCache.getOrEvaluate(candidate, norm);
      candidate.aiMatch = match;
      candidate.matchScore = match.score;
      candidate.verdict = match.verdict;
      candidate.fitCategory = match.fitCategory;
      candidate.recommendation = match.recommendation;
      candidate.eligibilityStatus = match.eligibilityStatus;
      candidate.extractionStatus = match.extractionStatus;
      renderResults(scrapedCandidates);
    }

    if (!match) return;

    const nameEl = document.getElementById('dossier-cand-name');
    const roleEl = document.getElementById('dossier-cand-role');
    const jobEl = document.getElementById('dossier-job-title');
    const scoreVal = document.getElementById('dossier-score-val');
    const verdictTag = document.getElementById('dossier-verdict-tag');
    const recBadge = document.getElementById('dossier-recommendation-badge');
    const metaConfidence = document.getElementById('dossier-meta-confidence');
    const metaCoverage = document.getElementById('dossier-meta-coverage');
    const metaEligibility = document.getElementById('dossier-meta-eligibility');
    const reasoningText = document.getElementById('dossier-reasoning-text');
    const eligNotesText = document.getElementById('dossier-eligibility-notes');
    const tableBody = document.getElementById('dossier-skills-table-body');
    const strengthsBox = document.getElementById('dossier-strengths-box');
    const gapsBox = document.getElementById('dossier-gaps-box');
    const questionsBox = document.getElementById('dossier-questions-box');
    const provBanner = document.getElementById('dossier-provisional-banner');
    const extBadge = document.getElementById('dossier-extraction-badge');
    const charCountEl = document.getElementById('dossier-char-count');

    if (nameEl) nameEl.innerText = candidate.name || 'Candidate';
    if (roleEl) roleEl.innerText = `${candidate.title || 'Specialist'} · ${candidate.location || 'United States'} · ${candidate.visaStatus || 'US Work Authorized'}`;
    if (jobEl) jobEl.innerText = `Target: ${cleanJobTitle(targetJob?.title || 'Open Position')}`;

    // Extraction badge and character count
    const resumeLen = (candidate.resumeText || '').length;
    if (extBadge) {
      const isProv = match.extractionVerification?.isProvisional || match.extractionStatus !== 'FULL_RESUME_EXTRACTED';
      extBadge.innerText = (match.extractionStatus || (isProv ? 'PARTIAL_RESUME_EXTRACTED' : 'FULL_RESUME_EXTRACTED')).replace(/_/g, ' ');
      extBadge.style.color = isProv ? '#B45309' : '#15803D';
    }
    if (charCountEl) {
      charCountEl.innerText = `(${resumeLen.toLocaleString()} chars analyzed)`;
    }

    // Provisional warning display
    if (provBanner) {
      if (match.extractionVerification?.isProvisional || match.extractionStatus !== 'FULL_RESUME_EXTRACTED') {
        provBanner.style.display = 'block';
        provBanner.innerHTML = `⚠️ <strong>PARTIAL PROFILE WARNING:</strong> Candidate profile has limited text (${(match.extractionStatus || 'PARTIAL_RESUME_EXTRACTED').replace(/_/g, ' ')}). This evaluation is PROVISIONAL. Inspect the full resume before submitting.`;
      } else {
        provBanner.style.display = 'none';
      }
    }

    const score = match.score ?? candidate.matchScore ?? 75;
    const color = match.color || (score >= 85 ? '#059669' : (score >= 70 ? '#2563EB' : '#D97706'));

    if (scoreVal) {
      scoreVal.innerText = `${score}%`;
      scoreVal.style.color = color;
    }
    if (verdictTag) {
      const fitLabel = match.fitCategory || match.verdict || (score >= 85 ? 'Strong Fit' : (score >= 70 ? 'Good Fit' : 'Partial Fit'));
      verdictTag.innerText = String(fitLabel).toUpperCase();
      verdictTag.style.background = color + '15';
      verdictTag.style.color = color;
    }
    if (recBadge) {
      const rec = match.recommendation || (score >= 80 ? 'Submit' : (score >= 65 ? 'Interview' : 'Hold for Verification'));
      recBadge.innerText = `RECOMMENDATION: ${rec.toUpperCase()}`;
      if (rec.toLowerCase().includes('submit')) {
        recBadge.style.background = '#ECFDF5';
        recBadge.style.color = '#065F46';
        recBadge.style.borderColor = '#A7F3D0';
      } else if (rec.toLowerCase().includes('interview')) {
        recBadge.style.background = '#EFF6FF';
        recBadge.style.color = '#1E40AF';
        recBadge.style.borderColor = '#BFDBFE';
      } else if (rec.toLowerCase().includes('reject')) {
        recBadge.style.background = '#FEE2E2';
        recBadge.style.color = '#991B1B';
        recBadge.style.borderColor = '#FECACA';
      } else {
        recBadge.style.background = '#FFFBEB';
        recBadge.style.color = '#92400E';
        recBadge.style.borderColor = '#FDE68A';
      }
    }

    if (metaConfidence) metaConfidence.innerText = match.confidence || (score >= 70 ? 'High' : 'Medium');
    if (metaCoverage) metaCoverage.innerText = match.evidenceCoverage || 'High';
    if (metaEligibility) {
      const elig = match.eligibilityStatus || 'Eligible — Evidence Available';
      metaEligibility.innerText = elig;
      metaEligibility.style.color = (elig.includes('Eligible') || elig === 'VERIFIED_ELIGIBLE') ? '#059669' : ((elig.includes('Conflict') || elig === 'INELIGIBLE') ? '#DC2626' : '#D97706');
    }

    if (reasoningText) reasoningText.innerText = match.recommendationExplanation || match.reasoning || candidate.aiReasoning || 'Candidate evaluated against job description.';
    if (eligNotesText) {
      eligNotesText.innerHTML = `<strong>Location &amp; Eligibility:</strong> ${match.eligibilityNotes || `${candidate.location || 'United States'} fits requisition requirements.`}`;
    }

    // Render Excel-Style Skills Table
    if (tableBody) {
      const rows = match.skillsMatchTable && Array.isArray(match.skillsMatchTable) && match.skillsMatchTable.length > 0
        ? match.skillsMatchTable
        : (candidate.skills || []).map(s => ({
            requirement: s,
            category: 'Mandatory Technical',
            classification: 'Mandatory',
            evidenceStatus: 'DIRECT MATCH',
            resumeEvidence: `Demonstrated ${s} noted in candidate profile.`,
            gapOrQualification: ''
          }));

      tableBody.innerHTML = rows.map((r, rIdx) => {
        let badgeBg = '#F1F5F9';
        let badgeColor = '#475569';
        const st = (r.evidenceStatus || '').toUpperCase();
        if (st.includes('DIRECT')) {
          badgeBg = '#DCFCE7';
          badgeColor = '#15803D';
        } else if (st.includes('STRONG') || st.includes('EQUIVALENT')) {
          badgeBg = '#DBEAFE';
          badgeColor = '#1E40AF';
        } else if (st.includes('PARTIAL')) {
          badgeBg = '#FEF3C7';
          badgeColor = '#B45309';
        } else if (st.includes('VERIFICATION')) {
          badgeBg = '#F3E8FF';
          badgeColor = '#6B21A8';
        }

        const zebraBg = rIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        return `
          <tr style="background:${zebraBg};">
            <td style="padding:6px 8px; border:1px solid #CBD5E1; font-weight:700; color:#0F172A;">${r.requirement || 'Requirement'}</td>
            <td style="padding:6px 8px; border:1px solid #CBD5E1; color:#64748B;">
              ${r.category || 'Technical'}
              <span style="display:block; font-size:9.5px; opacity:0.8;">(${r.classification || 'Mandatory'})</span>
            </td>
            <td style="padding:6px 8px; border:1px solid #CBD5E1;">
              <span style="display:inline-block; font-size:9.5px; font-weight:800; padding:2px 6px; border-radius:4px; background:${badgeBg}; color:${badgeColor};">
                ${r.evidenceStatus || 'EVALUATED'}
              </span>
            </td>
            <td style="padding:6px 8px; border:1px solid #CBD5E1; color:#334155; line-height:1.4;">
              ${r.resumeEvidence ? `<span>"${r.resumeEvidence}"</span>` : '<span style="color:#94A3B8; font-style:italic;">Not demonstrated in resume</span>'}
              ${r.gapOrQualification ? `<div style="color:#B45309; font-size:10px; margin-top:2px;">• ${r.gapOrQualification}</div>` : ''}
            </td>
          </tr>
        `;
      }).join('');
    }

    if (strengthsBox) {
      strengthsBox.innerHTML = (match.strengths && match.strengths.length > 0)
        ? match.strengths.map(s => `<div>• ${s}</div>`).join('')
        : '<div>• Strong foundational experience aligned with target role</div>';
    }

    if (gapsBox) {
      gapsBox.innerHTML = (match.gaps && match.gaps.length > 0)
        ? match.gaps.map(g => `<div>• ${g}</div>`).join('')
        : '<div>• No critical gaps detected against job profile</div>';
    }

    if (questionsBox) {
      questionsBox.innerHTML = (match.interviewQuestions && match.interviewQuestions.length > 0)
        ? match.interviewQuestions.map((q, qIdx) => `<div><strong>Q${qIdx+1}:</strong> ${q}</div>`).join('')
        : '<div>• Can you summarize your primary technical contributions in your recent project?</div>';
    }

    overlay.style.display = 'flex';
  }

  function closeAiDossier() {
    const overlay = document.getElementById('smarthire-dossier-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  async function runAiFitAnalysis() {
    if (!isUserAuthenticated || !currentUser) {
      alert('Authentication Required: Please sign in with your SmartHire ATS credentials to run AI match analysis.');
      checkAndApplyAuthGate();
      return;
    }

    if (!selectedJob) {
      alert('Please select a target Requisition first from the top dropdown to compare candidate profiles against.');
      return;
    }

    if (!scrapedCandidates || scrapedCandidates.length === 0) {
      alert('No extracted candidates found. Please scrape candidate profiles first.');
      return;
    }

    const btn = document.getElementById('smarthire-btn-ai-match');
    const btnText = document.getElementById('smarthire-ai-match-btn-text');
    if (btn) {
      btn.disabled = true;
      btn.style.opacity = '0.7';
    }
    if (btnText) btnText.innerText = `Analyzing ${scrapedCandidates.length} candidate(s) with AI...`;

    try {
      const payload = {
        candidates: scrapedCandidates.map((c, i) => ({
          id: c.id || `scraped-${i}`,
          name: c.name,
          title: c.title,
          role: c.title,
          skills: c.skills,
          experience: c.experience,
          summary: c.summary || c.resumeText || '',
          resumeText: c.resumeText || c.summary || '',
          location: c.location,
          visaStatus: c.visaStatus || ''
        })),
        job: {
          id: selectedJob.id || selectedJob.reqId,
          title: selectedJob.title,
          skills: selectedJob.skills,
          description: selectedJob.description || selectedJob.fullDescription || '',
          location: selectedJob.location
        },
        targetReqId: selectedJob.id || selectedJob.reqId
      };

      let matches = null;

      // Strategy 1: Extension background service worker (if extension context is connected)
      if (typeof chrome !== 'undefined' && chrome?.runtime?.id) {
        try {
          const res = await new Promise((resolve, reject) => {
            try {
              chrome.runtime.sendMessage({
                action: 'AI_MATCH_BATCH',
                payload
              }, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            } catch (sendErr) {
              reject(sendErr);
            }
          });
          if (res && res.success && Array.isArray(res.matches)) {
            matches = res.matches;
          }
        } catch (bgErr) {
          console.warn('[SmartHire Dock] Background AI match error, falling back:', bgErr.message);
        }
      }

      // Strategy 2: Direct fetch to ATS server (bypasses service worker)
      if (!matches) {
        try {
          const fetchRes = await fetch('https://smarthireus.com/api/recruiter/ai-match-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (fetchRes.ok) {
            const data = await fetchRes.json();
            if (data && data.success && Array.isArray(data.matches)) {
              matches = data.matches;
            }
          }
        } catch (fetchErr) {
          console.warn('[SmartHire Dock] Direct fetch error, falling back to local engine:', fetchErr.message);
        }
      }

      // Strategy 3: Authoritative in-browser SmartHireMatchingEngine (Zero external dependency fallback)
      if (!matches && window.SmartHireMatchingEngine) {
        try {
          console.log('[SmartHire Dock] Running in-tab authoritative SmartHireMatchingEngine...');
          matches = payload.candidates.map(cand => {
            return window.SmartHireMatchingEngine.evaluateCandidate(cand, payload.job);
          });
        } catch (engineErr) {
          console.error('[SmartHire Dock] Local engine evaluation error:', engineErr);
        }
      }

      if (matches && Array.isArray(matches) && matches.length > 0) {
        matches.forEach((m, idx) => {
          if (scrapedCandidates[idx]) {
            scrapedCandidates[idx].aiMatch = m;
            scrapedCandidates[idx].matchScore = m.score;
            scrapedCandidates[idx].verdict = m.verdict;
            scrapedCandidates[idx].fitCategory = m.fitCategory || m.verdict;
            scrapedCandidates[idx].confidence = m.confidence;
            scrapedCandidates[idx].evidenceCoverage = m.evidenceCoverage;
            scrapedCandidates[idx].recommendation = m.recommendation;
            scrapedCandidates[idx].recommendationExplanation = m.recommendationExplanation || m.reasoning;
            scrapedCandidates[idx].eligibilityStatus = m.eligibilityStatus;
            scrapedCandidates[idx].eligibilityNotes = m.eligibilityNotes;
            scrapedCandidates[idx].strengths = m.strengths;
            scrapedCandidates[idx].gaps = m.gaps;
            scrapedCandidates[idx].skillsMatchTable = m.skillsMatchTable;
            scrapedCandidates[idx].requiredSkills = m.requiredSkills;
            scrapedCandidates[idx].preferredSkills = m.preferredSkills;
            scrapedCandidates[idx].experienceAndCertifications = m.experienceAndCertifications;
            scrapedCandidates[idx].interviewQuestions = m.interviewQuestions;
            scrapedCandidates[idx].aiReasoning = m.recommendationExplanation || m.reasoning;
          }
        });

        // Sort candidates by AI score descending
        scrapedCandidates.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

        renderResults(scrapedCandidates);
        if (btnText) btnText.innerText = `✓ AI Analysis Done (${scrapedCandidates.length} Ranked)`;
      } else {
        alert('Could not complete AI matching. Please refresh the page (Cmd+R or F5) and try again.');
      }
    } catch (err) {
      console.error('[AI Match Error]', err);
      // Fallback to local engine immediately so candidate analysis is not lost
      if (window.SmartHireMatchingEngine && selectedJob) {
        try {
          scrapedCandidates.forEach(cand => {
            const m = window.SmartHireMatchingEngine.evaluateCandidate(cand, selectedJob);
            cand.aiMatch = m;
            cand.matchScore = m.score;
            cand.verdict = m.verdict;
            cand.fitCategory = m.fitCategory || m.verdict;
            cand.confidence = m.confidence;
            cand.evidenceCoverage = m.evidenceCoverage;
            cand.recommendation = m.recommendation;
            cand.recommendationExplanation = m.recommendationExplanation || m.reasoning;
            cand.eligibilityStatus = m.eligibilityStatus;
            cand.eligibilityNotes = m.eligibilityNotes;
            cand.strengths = m.strengths;
            cand.gaps = m.gaps;
            cand.skillsMatchTable = m.skillsMatchTable;
            cand.requiredSkills = m.requiredSkills;
            cand.preferredSkills = m.preferredSkills;
            cand.experienceAndCertifications = m.experienceAndCertifications;
            cand.interviewQuestions = m.interviewQuestions;
            cand.aiReasoning = m.recommendationExplanation || m.reasoning;
          });
          scrapedCandidates.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
          renderResults(scrapedCandidates);
          if (btnText) btnText.innerText = `✓ AI Analysis Done (${scrapedCandidates.length} Ranked)`;
          return;
        } catch (_) {}
      }
      if (err.message && err.message.includes('Extension context invalidated')) {
        alert('The extension was recently reloaded in Chrome. Please refresh this page (Cmd+R or F5) to reconnect.');
      } else {
        alert('AI Match error: ' + err.message);
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    }
  }

  async function runSingleAiMatch(candidate, job) {
    if (!isUserAuthenticated || !currentUser) {
      alert('Authentication required: Please sign in.');
      checkAndApplyAuthGate();
      return;
    }
    const targetJob = job || selectedJob;
    if (!targetJob) {
      alert('Please select a target Requisition first from the top dropdown.');
      return;
    }

    try {
      const payload = {
        candidate: {
          id: candidate.id,
          name: candidate.name,
          title: candidate.title,
          role: candidate.title,
          skills: candidate.skills,
          experience: candidate.experience,
          summary: candidate.summary || candidate.resumeText || '',
          resumeText: candidate.resumeText || candidate.summary || '',
          location: candidate.location,
          visaStatus: candidate.visaStatus || ''
        },
        job: {
          id: targetJob.id || targetJob.reqId,
          title: targetJob.title,
          skills: targetJob.skills,
          description: targetJob.description || targetJob.fullDescription || '',
          location: targetJob.location
        },
        targetReqId: targetJob.id || targetJob.reqId
      };

      let m = null;

      // Strategy 1: Background service worker
      if (typeof chrome !== 'undefined' && chrome?.runtime?.id) {
        try {
          const res = await new Promise((resolve, reject) => {
            try {
              chrome.runtime.sendMessage({ action: 'AI_MATCH_CANDIDATE', payload }, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            } catch (sendErr) {
              reject(sendErr);
            }
          });
          if (res && res.success && res.match) {
            m = res.match;
          }
        } catch (_) {}
      }

      // Strategy 2: Direct fetch to ATS server
      if (!m) {
        try {
          const fetchRes = await fetch('https://smarthireus.com/api/recruiter/ai-match-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (fetchRes.ok) {
            const data = await fetchRes.json();
            if (data && data.success && data.match) {
              m = data.match;
            }
          }
        } catch (_) {}
      }

      // Strategy 3: Authoritative local matching engine fallback
      if (!m && window.SmartHireMatchingEngine) {
        m = window.SmartHireMatchingEngine.evaluateCandidate(payload.candidate, payload.job);
      }

      if (m) {
        candidate.aiMatch = m;
        candidate.matchScore = m.score;
        candidate.verdict = m.verdict;
        candidate.fitCategory = m.fitCategory || m.verdict;
        candidate.confidence = m.confidence;
        candidate.evidenceCoverage = m.evidenceCoverage;
        candidate.recommendation = m.recommendation;
        candidate.recommendationExplanation = m.recommendationExplanation || m.reasoning;
        candidate.eligibilityStatus = m.eligibilityStatus;
        candidate.eligibilityNotes = m.eligibilityNotes;
        candidate.strengths = m.strengths;
        candidate.gaps = m.gaps;
        candidate.skillsMatchTable = m.skillsMatchTable;
        candidate.requiredSkills = m.requiredSkills;
        candidate.preferredSkills = m.preferredSkills;
        candidate.experienceAndCertifications = m.experienceAndCertifications;
        candidate.interviewQuestions = m.interviewQuestions;
        candidate.aiReasoning = m.recommendationExplanation || m.reasoning;

        renderResults(scrapedCandidates);
        openAiDossier(candidate, targetJob);
      }
    } catch (e) {
      if (window.SmartHireMatchingEngine && targetJob) {
        try {
          const m = window.SmartHireMatchingEngine.evaluateCandidate(candidate, targetJob);
          candidate.aiMatch = m;
          candidate.matchScore = m.score;
          candidate.verdict = m.verdict;
          candidate.fitCategory = m.fitCategory || m.verdict;
          candidate.confidence = m.confidence;
          candidate.evidenceCoverage = m.evidenceCoverage;
          candidate.recommendation = m.recommendation;
          candidate.recommendationExplanation = m.recommendationExplanation || m.reasoning;
          candidate.eligibilityStatus = m.eligibilityStatus;
          candidate.eligibilityNotes = m.eligibilityNotes;
          candidate.strengths = m.strengths;
          candidate.gaps = m.gaps;
          candidate.skillsMatchTable = m.skillsMatchTable;
          candidate.requiredSkills = m.requiredSkills;
          candidate.preferredSkills = m.preferredSkills;
          candidate.experienceAndCertifications = m.experienceAndCertifications;
          candidate.interviewQuestions = m.interviewQuestions;
          candidate.aiReasoning = m.recommendationExplanation || m.reasoning;

          renderResults(scrapedCandidates);
          openAiDossier(candidate, targetJob);
          return;
        } catch (_) {}
      }
      alert('AI Match error: ' + e.message);
    }
  }

  function fetchLiveJobs() {
    const badge = document.getElementById('smarthire-job-count-badge');
    if (badge) badge.innerText = 'Refreshing...';

    const handleJobsData = (jobsList) => {
      if (Array.isArray(jobsList) && jobsList.length > 0) {
        allJobs = jobsList;
        filteredJobs = [...allJobs];
        renderJobsSelect(false);
      } else if (badge) {
        badge.innerText = `${allJobs.length} Jobs`;
      }
    };

    function tryDirectFetch() {
      fetch('https://smarthireus.com/api/jobs')
        .then(res => res.json())
        .then(data => {
          const list = Array.isArray(data) ? data : (Array.isArray(data?.jobs) ? data.jobs : []);
          if (list.length > 0) {
            handleJobsData(list);
          } else if (window.BUNDLED_JOBS && window.BUNDLED_JOBS.length > 0) {
            handleJobsData(window.BUNDLED_JOBS);
          }
        })
        .catch(() => {
          if (window.BUNDLED_JOBS && window.BUNDLED_JOBS.length > 0) {
            handleJobsData(window.BUNDLED_JOBS);
          } else if (badge) {
            badge.innerText = `${allJobs.length} Jobs`;
          }
        });
    }

    if (typeof chrome !== 'undefined' && chrome?.runtime?.id) {
      try {
        chrome.runtime.sendMessage({ action: 'FETCH_JOBS' }, (response) => {
          if (!chrome.runtime.lastError && response && response.success && Array.isArray(response.jobs) && response.jobs.length > 0) {
            handleJobsData(response.jobs);
          } else {
            tryDirectFetch();
          }
        });
      } catch (_) {
        tryDirectFetch();
      }
    } else {
      tryDirectFetch();
    }
  }

  function renderJobsSelect(preserveSelection = false) {
    const select = document.getElementById('smarthire-req-select');
    const badge = document.getElementById('smarthire-job-count-badge');
    if (!select) return;

    if (badge) badge.innerText = `${filteredJobs.length} of ${allJobs.length} Jobs`;

    if (filteredJobs.length === 0) {
      select.innerHTML = '<option value="">No matching requisitions found</option>';
      return;
    }

    select.innerHTML = filteredJobs.map(j => {
      const id = j.id || j.reqId;
      const title = j.title || 'Requisition';
      const loc = j.location || 'Remote';
      return `<option value="${id}">#${id} · ${title} (${loc})</option>`;
    }).join('');

    if (!preserveSelection || !selectedJob) {
      selectedJob = filteredJobs[0];
      select.value = selectedJob.id || selectedJob.reqId;
    } else {
      select.value = selectedJob.id || selectedJob.reqId;
    }

    updateJobDisplay();
  }

  function updateJobDisplay() {
    const info = document.getElementById('smarthire-req-info');
    if (!selectedJob || !info) return;

    const bQueries = window.SmartHireMatchingEngine 
      ? window.SmartHireMatchingEngine.generateBooleanQueries(selectedJob)
      : null;

    const skills = Array.isArray(selectedJob.skills) 
      ? selectedJob.skills.slice(0, 5).join(', ') 
      : (selectedJob.skills || 'Core Skills');

    const primaryQuery = bQueries ? bQueries.primaryTemplate : generateBooleanQuery(selectedJob);
    const locNotice = bQueries?.locationFilterNotice || (selectedJob.location || 'Remote');

    info.innerHTML = `
      <div style="font-weight:700; color:#0F172A; margin-bottom:3px;">#${selectedJob.id} · ${selectedJob.title}</div>
      <div style="color:#64748B;"><strong>Location:</strong> ${selectedJob.location || 'Remote'} | <strong>Rate:</strong> ${selectedJob.rate || 'Open'}</div>
      <div style="color:#2563EB; margin-top:2px;"><strong>Key Skills:</strong> ${skills}</div>
      <div style="margin-top:6px; padding:6px 8px; background:#F1F5F9; border-radius:4px; border:1px solid #CBD5E1;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
          <strong style="color:#1E293B; font-size:10px;">BOOLEAN SOURCING QUERY:</strong>
          <button type="button" id="smarthire-btn-copy-query" style="font-size:9.5px; padding:1px 6px; background:#FFFFFF; border:1px solid #CBD5E1; border-radius:3px; cursor:pointer; color:#2563EB; font-weight:700;">Copy</button>
        </div>
        <div id="smarthire-query-text" style="font-family:monospace; font-size:10px; color:#334155; word-break:break-all; max-height:45px; overflow-y:auto;">${primaryQuery}</div>
        ${bQueries?.mandatoryResidency ? `<div style="color:#92400E; font-size:9.5px; margin-top:4px; font-weight:600;">• ${locNotice}</div>` : ''}
      </div>
    `;

    document.getElementById('smarthire-btn-copy-query')?.addEventListener('click', () => {
      if (window.SmartHireUtils && typeof window.SmartHireUtils.safeCopyToClipboard === 'function') {
        window.SmartHireUtils.safeCopyToClipboard(primaryQuery);
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(primaryQuery);
      }
      const btn = document.getElementById('smarthire-btn-copy-query');
      if (btn) btn.innerText = 'Copied!';
      setTimeout(() => { if (btn) btn.innerText = 'Copy'; }, 1500);
    });
  }

  function generateBooleanQuery(job) {
    if (window.SmartHireMatchingEngine) {
      return window.SmartHireMatchingEngine.generateBooleanQueries(job).primaryTemplate;
    }
    const title = (job?.title || '').replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
    const skills = Array.isArray(job?.skills) ? job.skills.slice(0, 3) : (job?.skills ? String(job.skills).split(',').slice(0, 3) : []);
    if (skills.length > 0) {
      const skillClause = skills.map(s => `"${s.trim()}"`).join(' OR ');
      return `("${title}") AND (${skillClause})`;
    }
    return `"${title}"`;
  }

  function applyPreset(preset) {
    activeFlow = Object.assign({}, preset);
    document.getElementById('flow-container-sel').value = preset.containerSelector || '';
    document.getElementById('flow-click-sel').value = preset.clickSelector || '';
    document.getElementById('flow-tab-sel').value = preset.tabSelector || '';
    document.getElementById('flow-name-sel').value = preset.nameSelector || '';
    document.getElementById('flow-email-sel').value = preset.emailSelector || '';
    document.getElementById('flow-phone-sel').value = preset.phoneSelector || '';
    document.getElementById('flow-delay-val').value = preset.delayMs || 500;
    saveActiveFlowFromInputs();
    updateContainerCountBadge();
  }

  function saveActiveFlowFromInputs() {
    activeFlow = {
      containerSelector: document.getElementById('flow-container-sel').value.trim(),
      clickSelector: document.getElementById('flow-click-sel').value.trim(),
      tabSelector: document.getElementById('flow-tab-sel').value.trim(),
      nameSelector: document.getElementById('flow-name-sel').value.trim(),
      emailSelector: document.getElementById('flow-email-sel').value.trim(),
      phoneSelector: document.getElementById('flow-phone-sel').value.trim(),
      delayMs: parseInt(document.getElementById('flow-delay-val').value, 10) || 500
    };
    try {
      localStorage.setItem('smarthire_custom_flow', JSON.stringify(activeFlow));
    } catch (e) {}
  }

  function updateContainerCountBadge() {
    const badge = document.getElementById('container-count-badge');
    const containerSel = document.getElementById('flow-container-sel')?.value.trim();
    if (!badge || !containerSel) return;
    try {
      const count = document.querySelectorAll(containerSel).length;
      badge.innerText = `(${count} found on page)`;
      badge.style.color = count > 0 ? '#059669' : '#DC2626';
    } catch (e) {
      badge.innerText = '(invalid selector)';
      badge.style.color = '#DC2626';
    }
  }

  // 3. Visual Element Picker (Interactive Hover & Click to Capture Selector)
  function startVisualElementPicker(targetInputId) {
    const drawer = document.getElementById('smarthire-copilot-drawer');
    if (drawer) drawer.classList.add('minimized');

    // Create highlight box
    let box = document.getElementById('smarthire-inspect-box');
    if (!box) {
      box = document.createElement('div');
      box.id = 'smarthire-inspect-box';
      document.body.appendChild(box);
    }

    // Create tag badge
    let badge = document.getElementById('smarthire-inspect-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'smarthire-inspect-badge';
      document.body.appendChild(badge);
    }

    // Create top banner
    let banner = document.getElementById('smarthire-inspect-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'smarthire-inspect-banner';
      banner.innerHTML = `
        <span>🎯 <strong>Click on any element</strong> to capture selector</span>
        <button id="smarthire-cancel-inspect">Cancel</button>
      `;
      document.body.appendChild(banner);
    }

    let hoveredEl = null;

    function onMouseMove(e) {
      const target = e.target;
      if (
        !target || 
        target.closest('#smarthire-copilot-drawer') || 
        target.closest('#smarthire-copilot-trigger') || 
        target.closest('#smarthire-inspect-banner')
      ) {
        box.style.display = 'none';
        badge.style.display = 'none';
        return;
      }

      hoveredEl = target;
      const rect = target.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      box.style.display = 'block';
      box.style.top = `${rect.top + scrollY}px`;
      box.style.left = `${rect.left + scrollX}px`;
      box.style.width = `${rect.width}px`;
      box.style.height = `${rect.height}px`;

      const selectorPreview = computeOptimalSelector(target);
      badge.style.display = 'block';
      badge.style.top = `${Math.max(0, rect.top + scrollY - 24)}px`;
      badge.style.left = `${rect.left + scrollX}px`;
      badge.innerText = selectorPreview;
    }

    function onClick(e) {
      if (
        e.target.closest('#smarthire-copilot-drawer') || 
        e.target.closest('#smarthire-copilot-trigger') || 
        e.target.closest('#smarthire-inspect-banner')
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (hoveredEl) {
        const optimal = computeOptimalSelector(hoveredEl);
        const targetInp = document.getElementById(targetInputId);
        if (targetInp) {
          targetInp.value = optimal;
          targetInp.style.borderColor = '#059669';
          setTimeout(() => { targetInp.style.borderColor = '#CBD5E1'; }, 1500);
        }
        saveActiveFlowFromInputs();
        updateContainerCountBadge();
      }

      stopInspection();
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') stopInspection();
    }

    function stopInspection() {
      document.removeEventListener('mousemove', onMouseMove, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown, true);
      if (box) box.style.display = 'none';
      if (badge) badge.style.display = 'none';
      if (banner) banner.remove();
      if (drawer) drawer.classList.remove('minimized');
    }

    document.getElementById('smarthire-cancel-inspect')?.addEventListener('click', stopInspection);
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
  }

  // Calculate clean, robust selector for any element (avoids bare generic tags like span)
  function computeOptimalSelector(el) {
    if (!el || el === document.body) return '';

    // Direct ID
    if (el.id && !el.id.match(/\d{5,}/)) {
      return `#${el.id}`;
    }

    // Custom element tag (like smui-card)
    const tag = el.tagName.toLowerCase();
    if (tag.includes('-') || tag === 'smui-card') {
      return tag;
    }

    // Meaningful classes on current element
    const classes = Array.from(el.classList || []).filter(c => 
      !c.match(/^css-/) && 
      !c.match(/^[a-z0-9]{6,}$/i) && 
      !c.includes('active') && 
      !c.includes('focus')
    );
    if (classes.length > 0) {
      return `.${classes.join('.')}`;
    }

    // Direct test attributes
    const testId = el.getAttribute('data-testid');
    if (testId) return `[data-testid="${testId}"]`;

    // Walk up to find meaningful parent container (e.g. .candidate-name span)
    let curr = el;
    let path = [tag];
    while (curr && curr.parentElement && curr.parentElement !== document.body && path.length < 3) {
      curr = curr.parentElement;
      if (curr.id && !curr.id.match(/\d{5,}/)) {
        path.unshift(`#${curr.id}`);
        break;
      }
      const pClasses = Array.from(curr.classList || []).filter(c => 
        !c.match(/^css-/) && !c.match(/^[a-z0-9]{6,}$/i) && !c.includes('active')
      );
      if (pClasses.length > 0) {
        path.unshift(`.${pClasses[0]}`);
        break;
      }
      const pTag = curr.tagName.toLowerCase();
      if (pTag === 'smui-card' || pTag.includes('-')) {
        path.unshift(pTag);
        break;
      }
    }

    return path.join(' ');
  }

  // 4. Run Flow Studio Workflow (Step-by-step Loop & Extract)
  async function runFlowStudioWorkflow() {
    saveActiveFlowFromInputs();
    const status = document.getElementById('flow-run-status');
    const runBtn = document.getElementById('flow-btn-run');
    runBtn.disabled = true;
    runBtn.style.opacity = '0.7';

    try {
      const {
        containerSelector,
        clickSelector,
        tabSelector,
        nameSelector,
        emailSelector,
        phoneSelector,
        delayMs = 500
      } = activeFlow;

      if (!containerSelector) throw new Error('Please specify a card container selector');

      const containers = Array.from(document.querySelectorAll(containerSelector));
      if (containers.length === 0) {
        throw new Error(`No elements matched container: "${containerSelector}"`);
      }

      status.innerText = `Starting workflow across ${containers.length} candidate elements...`;

      const results = [];
      const seenNames = new Set();
      const sleep = ms => new Promise(r => setTimeout(r, ms));

      for (let i = 0; i < containers.length; i++) {
        const container = containers[i];
        status.innerText = `Processing candidate ${i + 1} of ${containers.length}...`;

        // Visual indicator on active card during execution
        container.scrollIntoView({ behavior: 'auto', block: 'center' });
        const oldOutline = container.style.outline;
        container.style.outline = '3px solid #10B981';
        container.style.borderRadius = '6px';

        // Action 1: Multi-event Click (dispatches pointerdown, mousedown, pointerup, mouseup, click)
        const isAnchorOrUnsafe = (el) => {
          if (!el) return true;
          if (el.tagName === 'A' || el.closest('a') || el.hasAttribute('href')) return true;
          if (el.type === 'checkbox' || el.closest('[role="checkbox"]') || el.closest('[class*="checkbox"]')) return true;
          if (el.closest('[data-testid*="favorite"]') || el.closest('[class*="favorite"]')) return true;
          return false;
        };

        const clickCandidates = [];
        if (clickSelector) {
          const userEl = container.querySelector(clickSelector);
          if (userEl && !isAnchorOrUnsafe(userEl)) clickCandidates.push(userEl);
        }
        const bodyEl = container.querySelector('.smui-card-body') || container.querySelector('[class*="card-body"]');
        if (bodyEl && !isAnchorOrUnsafe(bodyEl) && !clickCandidates.includes(bodyEl)) clickCandidates.push(bodyEl);
        if (!clickCandidates.includes(container) && !isAnchorOrUnsafe(container)) clickCandidates.push(container);

        const primaryTarget = clickCandidates[0] || container;
        const rect = primaryTarget.getBoundingClientRect();
        const clientX = rect.left + rect.width / 2;
        const clientY = rect.top + rect.height / 2;
        const evtInit = { bubbles: true, cancelable: true, view: window, clientX, clientY, buttons: 1 };

        primaryTarget.dispatchEvent(new PointerEvent('pointerdown', evtInit));
        primaryTarget.dispatchEvent(new MouseEvent('mousedown', evtInit));
        primaryTarget.dispatchEvent(new PointerEvent('pointerup', evtInit));
        primaryTarget.dispatchEvent(new MouseEvent('mouseup', evtInit));
        primaryTarget.dispatchEvent(new MouseEvent('click', evtInit));
        if (!isAnchorOrUnsafe(primaryTarget) && typeof primaryTarget.click === 'function') {
          try { primaryTarget.click(); } catch (e) {}
        }

        // Dynamic Polling: Wait up to 1800ms for detail pane to render contact details
        let email = '';
        let phone = '';
        const pollStart = Date.now();
        const maxWait = delayMs ? Math.max(delayMs, 1500) : 1800;

        while (Date.now() - pollStart < maxWait) {
          // Action 2: Ensure Resume tab is active so Monster renders contact legend (#contact-legend-detail) and resume document
          const resumeTab = (typeof window.findMonsterResumeTab === 'function' ? window.findMonsterResumeTab() : null) ||
                            Array.from(document.querySelectorAll('.tab__label, button, [role="tab"]')).find(t => {
                              const txt = (t.innerText || '').trim().toLowerCase();
                              return (txt === 'resume' || txt === 'cv') && t.getBoundingClientRect().left >= window.innerWidth * 0.20;
                            });
          if (resumeTab && typeof window.activateMonsterResumeTab === 'function') {
            window.activateMonsterResumeTab(resumeTab);
          } else if (resumeTab && typeof resumeTab.click === 'function') {
            try { resumeTab.click(); } catch (e) {}
          }

          // Check standard Monster/Dice deep contact extraction
          if (typeof window.extractMonsterContact === 'function') {
            const mc = window.extractMonsterContact();
            if (mc.email) email = mc.email;
            if (mc.phone) phone = mc.phone;
          }

          // Check custom email selector if user specified
          if (!email && emailSelector) {
            const el = document.querySelector(emailSelector);
            if (el) {
              const ems = window.SmartHireUtils ? window.SmartHireUtils.extractEmails(el.innerText || el.textContent) : [];
              if (ems.length > 0) email = ems[0];
            }
          }

          // Check custom phone selector if user specified
          if (!phone && phoneSelector) {
            const el = document.querySelector(phoneSelector);
            if (el) {
              const phs = window.SmartHireUtils ? window.SmartHireUtils.extractPhones(el.innerText || el.textContent) : [];
              if (phs.length > 0) phone = phs[0];
            }
          }

          if (email && phone) break;
          await sleep(150);
        }

        // Action 3: Extract Name (STRICTLY FROM CARD CONTAINER - NEVER FROM NAVBAR!)
        let name = '';
        const cardNameEl = container.querySelector('a[href*="/candidate/"], h2, h3, h4, [class*="name"], [class*="Name"]') ||
                           (nameSelector && !['span', 'div', 'p', 'a'].includes(nameSelector) ? container.querySelector(nameSelector) : null);
        if (cardNameEl && cardNameEl.innerText.trim()) {
          name = window.extractCleanMonsterName ? window.extractCleanMonsterName(cardNameEl.innerText) : cardNameEl.innerText.trim();
        }
        if (!name || name.length < 2) {
          name = window.extractCleanMonsterName ? window.extractCleanMonsterName(container.innerText) : container.innerText.split('\n')[0];
        }
        if (!name || name.toLowerCase().includes('need help') || name.length < 2) {
          name = `Candidate ${i + 1}`;
        }

        const nameKey = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (seenNames.has(nameKey)) {
          container.style.outline = oldOutline;
          continue;
        }
        seenNames.add(nameKey);

        // Fallback to container text if drawer did not disclose
        if (!email || !phone) {
          const cEmails = window.SmartHireUtils ? window.SmartHireUtils.extractEmails(container.innerText) : [];
          const cPhones = window.SmartHireUtils ? window.SmartHireUtils.extractPhones(container.innerText) : [];
          if (!email && cEmails.length > 0) email = cEmails[0];
          if (!phone && cPhones.length > 0) phone = cPhones[0];
        }

        // Title from card text
        let title = 'Candidate Profile';
        const cardLines = (container.innerText || '').split('\n').map(l => l.trim()).filter(Boolean);
        for (const line of cardLines) {
          const cl = window.extractCleanMonsterName ? window.extractCleanMonsterName(line) : line;
          if (
            cl &&
            cl !== name &&
            cl.length > 3 &&
            !cl.includes('Updated') &&
            !cl.includes('Current:') &&
            !cl.includes('Previous:') &&
            !cl.includes('Top Skills:') &&
            !cl.includes('Select a Card') &&
            !cl.includes('Viewed') &&
            !cl.includes('SMS Opt-in')
          ) {
            title = cl;
            break;
          }
        }

        let location = (typeof window.extractCleanMonsterLocation === 'function' ? window.extractCleanMonsterLocation(container.innerText || '') : '') ||
                       (window.SmartHireUtils && typeof window.SmartHireUtils.extractLocation === 'function' ? window.SmartHireUtils.extractLocation(container.innerText || '') : '') ||
                       'United States';

        container.style.outline = oldOutline;

        results.push({
          id: `flow-${i}-${Date.now().toString().slice(-4)}`,
          name,
          email: email || 'Not Disclosed',
          phone: phone || 'Not Disclosed',
          title: title.slice(0, 80),
          location,
          source: window.smartHirePortal || 'Monster+ Flow',
          profileUrl: window.location.href
        });

        status.innerText = `Extracted ${results.length} of ${containers.length}: ${name} (${email || phone || 'Profile'})`;
      }

      scrapedCandidates = results;
      status.innerText = `✓ Flow finished! Extracted ${results.length} candidate(s).`;
      renderResults(results);

    } catch (err) {
      console.error('[Flow Studio] Execution error:', err);
      status.innerText = `Error: ${err.message}`;
    } finally {
      runBtn.disabled = false;
      runBtn.style.opacity = '1';
    }
  }

  // 5. Quick Scrape execution
  async function runQuickScrape() {
    const status = document.getElementById('smarthire-scrape-status');
    const scrapeBtn = document.getElementById('smarthire-btn-scrape');
    scrapeBtn.disabled = true;
    scrapeBtn.style.opacity = '0.7';
    status.innerText = 'Extracting candidate profiles...';

    try {
      let list = [];
      if (typeof window.smartHireScrapeCandidatesAsync === 'function') {
        list = await window.smartHireScrapeCandidatesAsync((msg) => {
          status.innerText = msg;
        });
      } else if (typeof window.smartHireScrapeCandidates === 'function') {
        list = await window.smartHireScrapeCandidates((msg) => {
          status.innerText = msg;
        });
      }

      scrapedCandidates = list;
      if (list.length > 0) {
        status.innerText = `✓ Extracted ${list.length} candidate(s) successfully!`;
      } else {
        status.innerText = 'No candidates could be extracted. Please ensure Monster candidate cards are visible.';
      }
      renderResults(list);
    } catch (err) {
      status.innerText = `Error: ${err.message}`;
    } finally {
      scrapeBtn.disabled = false;
      scrapeBtn.style.opacity = '1';
    }
  }

  function renderResults(list) {
    const resultsCard = document.getElementById('smarthire-results-card');
    const countEl = document.getElementById('smarthire-count');
    const previewList = document.getElementById('smarthire-candidate-preview-list');

    if (list.length > 0) {
      resultsCard.style.display = 'block';
      countEl.innerText = list.length;

      // Auto-backfill missing contact details or generic location from authentic resume text
      list.forEach(c => {
        if (c.resumeText && c.resumeText.length > 50) {
          if (!c.email || c.email === 'Not Disclosed' || c.email.includes('coolsofttech') || c.email.includes('smarthireus')) {
            const e = (window.SmartHireUtils && typeof window.SmartHireUtils.extractCandidateEmail === 'function')
              ? window.SmartHireUtils.extractCandidateEmail(c.resumeText)
              : '';
            if (e && !e.includes('coolsofttech') && !e.includes('smarthireus')) c.email = e;
          }
          if (!c.phone || c.phone === 'Not Disclosed' || c.phone.length < 7) {
            const p = (window.SmartHireUtils && typeof window.SmartHireUtils.extractCandidatePhone === 'function')
              ? window.SmartHireUtils.extractCandidatePhone(c.resumeText)
              : '';
            if (p) c.phone = p;
          }
          if (!c.location || c.location === 'United States') {
            const loc = (typeof window.extractCleanMonsterLocation === 'function' ? window.extractCleanMonsterLocation(c.resumeText.slice(0, 2500)) : '') ||
                        (window.SmartHireUtils && typeof window.SmartHireUtils.extractLocation === 'function' ? window.SmartHireUtils.extractLocation(c.resumeText.slice(0, 2500)) : '');
            if (loc) c.location = loc;
          }
        }
      });

      // Select all by default if set is empty
      if (selectedCandidateIndices.size === 0) {
        list.forEach((_, i) => selectedCandidateIndices.add(i));
      }

      previewList.innerHTML = list.map((c, i) => {
        const hasPhone = c.phone && c.phone.length >= 7 && !c.phone.includes('555-0199') && c.phone !== 'Not Disclosed';
        const hasEmail = c.email && c.email.includes('@') && !c.email.includes('@monster.talent') && !c.email.includes('coolsofttech') && !c.email.includes('smarthireus') && c.email !== 'Not Disclosed';
        const isVerified = hasPhone || hasEmail;
        const isSent = (c.email && sentCandidateEmails.has(c.email.toLowerCase())) || (c.name && sentCandidateEmails.has(c.name.toLowerCase()));
        const isChecked = selectedCandidateIndices.has(i);
        const aiScore = c.aiMatch ? c.aiMatch.score : (c.matchScore || null);
        const aiVerdict = c.aiMatch ? c.aiMatch.verdict : (aiScore ? (aiScore >= 85 ? 'STRONG FIT' : (aiScore >= 70 ? 'GOOD FIT' : 'MODERATE FIT')) : null);
        const aiColor = c.aiMatch ? c.aiMatch.color : (aiScore ? (aiScore >= 85 ? '#059669' : (aiScore >= 70 ? '#2563EB' : '#D97706')) : '#7C3AED');

        const extStatus = c.extractionStatus || (c.resumeText && c.resumeText.length >= 800 ? 'FULL_RESUME_EXTRACTED' : (c.resumeText && c.resumeText.length >= 100 ? 'PARTIAL_RESUME_EXTRACTED' : 'PROFILE_ONLY'));
        let extPill = '<span style="background:#DCFCE7; color:#15803D; font-size:9.5px; font-weight:700; padding:2px 6px; border-radius:3px;">FULL RESUME</span>';
        if (extStatus === 'PARTIAL_RESUME_EXTRACTED') {
          extPill = '<span style="background:#FEF3C7; color:#B45309; font-size:9.5px; font-weight:700; padding:2px 6px; border-radius:3px;" title="Partial profile extracted">PARTIAL PROFILE ⚠️</span>';
        } else if (extStatus === 'PROFILE_ONLY') {
          extPill = '<span style="background:#F1F5F9; color:#64748B; font-size:9.5px; font-weight:600; padding:2px 6px; border-radius:3px;">PROFILE ONLY</span>';
        } else if (extStatus === 'EXTRACTION_FAILED') {
          extPill = '<span style="background:#FEE2E2; color:#DC2626; font-size:9.5px; font-weight:700; padding:2px 6px; border-radius:3px;">EXTRACTION FAILED</span>';
        }

        const rec = c.aiMatch?.recommendation || c.recommendation;
        const recPill = rec ? `
          <span style="font-size:9.5px; font-weight:800; padding:2px 6px; border-radius:3px; background:${rec.toLowerCase().includes('submit') ? '#ECFDF5' : (rec.toLowerCase().includes('interview') ? '#EFF6FF' : (rec.toLowerCase().includes('reject') ? '#FEE2E2' : '#FFFBEB'))}; color:${rec.toLowerCase().includes('submit') ? '#065F46' : (rec.toLowerCase().includes('interview') ? '#1E40AF' : (rec.toLowerCase().includes('reject') ? '#991B1B' : '#92400E'))}; border:1px solid ${rec.toLowerCase().includes('submit') ? '#A7F3D0' : (rec.toLowerCase().includes('interview') ? '#BFDBFE' : (rec.toLowerCase().includes('reject') ? '#FECACA' : '#FDE68A'))};">
            ${rec.toUpperCase()}
          </span>
        ` : '';

        const elig = c.aiMatch?.eligibilityStatus || c.eligibilityStatus;
        const eligPill = elig ? `
          <span style="font-size:9.5px; font-weight:700; padding:2px 6px; border-radius:3px; background:${elig === 'INELIGIBLE' || elig.includes('Conflict') ? '#FEE2E2' : (elig === 'PENDING_VERIFICATION' ? '#FFFBEB' : '#DCFCE7')}; color:${elig === 'INELIGIBLE' || elig.includes('Conflict') ? '#991B1B' : (elig === 'PENDING_VERIFICATION' ? '#92400E' : '#15803D')}; border:1px solid ${elig === 'INELIGIBLE' || elig.includes('Conflict') ? '#FECACA' : (elig === 'PENDING_VERIFICATION' ? '#FDE68A' : '#A7F3D0')};">
            ${elig === 'INELIGIBLE' || elig.includes('Conflict') ? 'INELIGIBLE' : (elig === 'PENDING_VERIFICATION' ? 'RESIDENCY PENDING' : 'ELIGIBLE')}
          </span>
        ` : '';

        return `
          <div style="padding:10px 12px; border-bottom:1px solid #F1F5F9; font-size:11px; background:${isChecked ? '#FAFAFA' : '#FFFFFF'};">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px;">
              <div style="display:flex; align-items:center; gap:6px;">
                <input type="checkbox" class="smarthire-cand-check" data-idx="${i}" ${isChecked ? 'checked' : ''} style="cursor:pointer; accent-color:#2563EB;" />
                <span style="font-weight:700; color:#0F172A; font-size:11.5px;">${c.aiMatch?.rank ? `#${c.aiMatch.rank} · ` : `${i + 1}. `}${c.name}</span>
              </div>
              <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap;">
                ${extPill}
                ${eligPill}
                ${recPill}
                ${isVerified 
                  ? '<span style="background:#DCFCE7; color:#15803D; font-size:9.5px; font-weight:700; padding:2px 6px; border-radius:3px;">VERIFIED CONTACT</span>' 
                  : '<span style="background:#F1F5F9; color:#64748B; font-size:9.5px; font-weight:600; padding:2px 6px; border-radius:3px;">PROFILE ONLY</span>'}
              </div>
            </div>
            <div style="color:#475569; font-size:11px; margin-top:2px; padding-left:20px;">${c.title} · ${c.location}</div>
            <div style="margin-top:4px; font-size:11px; display:flex; flex-direction:column; gap:2px; padding-left:20px;">
              <div style="color:#2563EB;"><strong>Email:</strong> ${c.email ? c.email : '<span style="color:#94A3B8; font-weight:normal;">Not Disclosed</span>'}</div>
              <div style="color:#0F172A; font-family:monospace;"><strong>Phone:</strong> ${c.phone ? c.phone : '<span style="color:#94A3B8; font-weight:normal;">Not Disclosed</span>'}</div>
            </div>

            <!-- AI Resume Fit Badge -->
            <div style="margin-top:6px; padding-left:20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:4px;">
              ${aiScore ? `
                <button type="button" class="smarthire-btn-dossier" data-cidx="${i}" style="border:none; cursor:pointer; background:${aiColor}15; color:${aiColor}; border:1px solid ${aiColor}35; font-size:10px; font-weight:800; padding:2px 8px; border-radius:12px; display:inline-flex; align-items:center; gap:4px;">
                  <span>AI Fit: ${aiScore}% (${aiVerdict})</span>
                  <span style="font-size:9.5px; text-decoration:underline;">Dossier ➔</span>
                </button>
                ${c.aiMatch?.reasoning ? `<span style="font-size:10px; color:#64748B; font-style:italic; max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${c.aiMatch.reasoning}</span>` : ''}
              ` : `
                <button type="button" class="smarthire-btn-run-single-ai" data-cidx="${i}" style="border:none; cursor:pointer; background:#F5F3FF; color:#7C3AED; border:1px solid #DDD6FE; font-size:10px; font-weight:700; padding:2px 7px; border-radius:10px; display:inline-flex; align-items:center; gap:4px;">
                  <span>Run AI Fit Score ➔</span>
                </button>
              `}
            </div>

            ${hasEmail ? `
              <div style="margin-top:6px; padding-left:20px; display:flex; justify-content:space-between; align-items:center;">
                <button type="button" class="smarthire-btn-outreach" data-cidx="${i}">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <span>Send JD Email</span>
                </button>
                ${isSent 
                  ? '<span style="color:#059669; font-weight:700; font-size:10px; background:#ECFDF5; border:1px solid #A7F3D0; padding:2px 6px; border-radius:3px;">✓ EMAIL SENT</span>' 
                  : ''}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

      // Checkbox event listeners
      previewList.querySelectorAll('.smarthire-cand-check').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const idx = parseInt(e.target.getAttribute('data-idx'), 10);
          if (e.target.checked) {
            selectedCandidateIndices.add(idx);
          } else {
            selectedCandidateIndices.delete(idx);
          }
          updateBulkEmailCount();
        });
      });

      // Bind outreach click events to each candidate
      previewList.querySelectorAll('.smarthire-btn-outreach').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.getAttribute('data-cidx'), 10);
          const cand = list[idx];
          if (cand) {
            openOutreachComposer(cand, selectedJob);
          }
        });
      });

      // Bind dossier click events
      previewList.querySelectorAll('.smarthire-btn-dossier').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.getAttribute('data-cidx'), 10);
          const cand = list[idx];
          if (cand) {
            openAiDossier(cand, selectedJob);
          }
        });
      });

      // Bind single AI match click events
      previewList.querySelectorAll('.smarthire-btn-run-single-ai').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.getAttribute('data-cidx'), 10);
          const cand = list[idx];
          if (cand) {
            runSingleAiMatch(cand, selectedJob);
          }
        });
      });

      updateBulkEmailCount();

    } else {
      resultsCard.style.display = 'none';
    }
  }

  function updateBulkEmailCount() {
    const validCount = scrapedCandidates.filter((c, i) => 
      (selectedCandidateIndices.size === 0 || selectedCandidateIndices.has(i)) &&
      c.email && c.email.includes('@') && !c.email.includes('@monster.talent') && c.email !== 'Not Disclosed'
    ).length;
    const badge = document.getElementById('smarthire-bulk-count');
    if (badge) badge.innerText = validCount;
  }

  async function copyCandidatesToClipboard() {
    if (!scrapedCandidates || scrapedCandidates.length === 0) return;
    const header = ['Sl. No', 'Candidate Name', 'Job Title', 'Email', 'Phone', 'Location', 'Source', 'Profile Link'];
    const rows = scrapedCandidates.map((c, i) => [
      i + 1,
      c.name,
      c.title,
      c.email || '',
      c.phone || '',
      c.location || '',
      c.source || window.smartHirePortal,
      c.profileUrl || ''
    ]);

    const tsv = [header.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    const msg = document.getElementById('smarthire-import-msg');

    let success = false;
    if (window.SmartHireUtils && typeof window.SmartHireUtils.safeCopyToClipboard === 'function') {
      success = await window.SmartHireUtils.safeCopyToClipboard(tsv);
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(tsv);
        success = true;
      } catch (e) {
        success = false;
      }
    }

    if (success) {
      msg.style.color = '#059669';
      msg.innerText = '✓ Copied TSV to clipboard! Press Ctrl+V in Excel or Google Sheets.';
      setTimeout(() => { msg.innerText = ''; }, 4000);
    } else {
      msg.style.color = '#DC2626';
      msg.innerText = 'Clipboard copy error. Please grant clipboard permissions.';
      setTimeout(() => { msg.innerText = ''; }, 4000);
    }
  }

  function importToSmartHireAts() {
    const msg = document.getElementById('smarthire-import-msg');
    if (!isUserAuthenticated || !currentUser) {
      if (msg) {
        msg.style.color = '#DC2626';
        msg.innerText = 'Authentication required. Please sign in to SmartHire ATS.';
      }
      checkAndApplyAuthGate();
      return;
    }

    if (!scrapedCandidates || scrapedCandidates.length === 0) {
      msg.innerText = 'No candidates to import.';
      return;
    }

    const targetReqId = selectedJob ? (selectedJob.id || selectedJob.reqId) : null;
    msg.style.color = '#2563EB';
    msg.innerText = `Ingesting ${scrapedCandidates.length} candidate(s) into SmartHire ATS...`;

    try {
      chrome.runtime.sendMessage({
        action: 'BULK_IMPORT_ATS',
        payload: {
          candidates: scrapedCandidates,
          targetReqId,
          source: window.smartHirePortal || 'Monster+ Flow Studio',
          recruiterEmail: currentUser.email,
          recruiterName: currentUser.name
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          msg.style.color = '#DC2626';
          msg.innerText = 'Extension reloaded. Please refresh tab (Cmd+R) and retry.';
          return;
        }
        if (response && response.success && response.data) {
          msg.style.color = '#059669';
          msg.innerText = `✓ ${response.data.message || 'Successfully imported into SmartHire ATS!'}`;
        } else {
          msg.style.color = '#DC2626';
          msg.innerText = `Import failed: ${response?.error || 'Could not connect to ATS'}`;
        }
      });
    } catch (err) {
      msg.style.color = '#DC2626';
      msg.innerText = 'Extension context updated. Please refresh tab (Cmd+R).';
    }
  }

  // Mount
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDock);
  } else {
    initDock();
  }
})();
