// SmartHire Talent Sourcing Copilot - Popup Controller
document.addEventListener('DOMContentLoaded', () => {
  // State variables
  let activeTab = null;
  let detectedPortal = 'Other';
  let jobsList = [];
  let selectedJob = null;
  let activeVariant = 1;
  let scrapedCandidates = [];
  let selectedCandidateIds = new Set();
  let currentUser = null;
  let isUserAuthenticated = false;
  let activePopupCand = null;
  const sentCandidateEmails = new Set();

  const API_BASE = 'https://smarthireus.com';

  // DOM Elements
  const popupRecruiterName = document.getElementById('popupRecruiterName');
  const popupRecruiterEmail = document.getElementById('popupRecruiterEmail');
  const popupAuthToggle = document.getElementById('popupAuthToggle');
  const popupLoginCard = document.getElementById('popupLoginCard');
  const popupLoginEmail = document.getElementById('popupLoginEmail');
  const popupLoginPass = document.getElementById('popupLoginPass');
  const popupDoLoginBtn = document.getElementById('popupDoLoginBtn');
  const popupCloseLoginBtn = document.getElementById('popupCloseLoginBtn');
  const popupLoginMsg = document.getElementById('popupLoginMsg');

  const popupComposerOverlay = document.getElementById('popupComposerOverlay');
  const popupComposerClose = document.getElementById('popupComposerClose');
  const popupCompSender = document.getElementById('popupCompSender');
  const popupCompName = document.getElementById('popupCompName');
  const popupCompEmail = document.getElementById('popupCompEmail');
  const popupCompTitle = document.getElementById('popupCompTitle');
  const popupCompSubject = document.getElementById('popupCompSubject');
  const popupCompBody = document.getElementById('popupCompBody');
  const popupCompStatus = document.getElementById('popupCompStatus');
  const popupCompCancel = document.getElementById('popupCompCancel');
  const popupCompSend = document.getElementById('popupCompSend');

  const popupBulkOutreachBtn = document.getElementById('popupBulkOutreachBtn');
  const popupBulkCountBadge = document.getElementById('popupBulkCountBadge');
  const popupBulkOverlay = document.getElementById('popupBulkOverlay');
  const popupBulkClose = document.getElementById('popupBulkClose');
  const popupBulkSender = document.getElementById('popupBulkSender');
  const popupBulkRecipientsCount = document.getElementById('popupBulkRecipientsCount');
  const popupBulkRecipientsChips = document.getElementById('popupBulkRecipientsChips');
  const popupBulkTitle = document.getElementById('popupBulkTitle');
  const popupBulkSubject = document.getElementById('popupBulkSubject');
  const popupBulkBody = document.getElementById('popupBulkBody');
  const popupBulkProgressContainer = document.getElementById('popupBulkProgressContainer');
  const popupBulkProgressBar = document.getElementById('popupBulkProgressBar');
  const popupBulkLiveLog = document.getElementById('popupBulkLiveLog');
  const popupBulkStatus = document.getElementById('popupBulkStatus');
  const popupBulkCancel = document.getElementById('popupBulkCancel');
  const popupBulkSend = document.getElementById('popupBulkSend');

  const portalBadge = document.getElementById('portalBadge');
  const portalName = document.getElementById('portalName');
  const jobSelect = document.getElementById('jobSelect');
  const refreshJobsBtn = document.getElementById('refreshJobsBtn');
  const jobMeta = document.getElementById('jobMeta');
  const metaLocation = document.getElementById('metaLocation');
  const metaSkills = document.getElementById('metaSkills');
  const variantPills = document.querySelectorAll('.variant-pill');
  const booleanQueryInput = document.getElementById('booleanQueryInput');
  const copyQueryBtn = document.getElementById('copyQueryBtn');
  const searchMonsterBtn = document.getElementById('searchMonsterBtn');
  const searchDiceBtn = document.getElementById('searchDiceBtn');
  const scrapePageBtn = document.getElementById('scrapePageBtn');
  const scrapeBtnLabel = document.getElementById('scrapeBtnLabel');
  const countTag = document.getElementById('countTag');
  const scrapeNotice = document.getElementById('scrapeNotice');
  const tableSection = document.getElementById('tableSection');
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const candidatesTableBody = document.getElementById('candidatesTableBody');
  const copyTsvBtn = document.getElementById('copyTsvBtn');
  const downloadCsvBtn = document.getElementById('downloadCsvBtn');
  const importAtsBtn = document.getElementById('importAtsBtn');
  const selectedCountBadge = document.getElementById('selectedCountBadge');
  const importFeedback = document.getElementById('importFeedback');

  const popupAiMatchBtn = document.getElementById('popupAiMatchBtn');
  const popupAiDossierOverlay = document.getElementById('popupAiDossierOverlay');
  const popupDossierClose = document.getElementById('popupDossierClose');
  const popupDossierCloseBtn = document.getElementById('popupDossierCloseBtn');
  const popupDossierOutreachBtn = document.getElementById('popupDossierOutreachBtn');
  const popupDossierCandName = document.getElementById('popupDossierCandName');
  const popupDossierCandRole = document.getElementById('popupDossierCandRole');
  const popupDossierJobTitle = document.getElementById('popupDossierJobTitle');
  const popupDossierScoreVal = document.getElementById('popupDossierScoreVal');
  const popupDossierVerdictTag = document.getElementById('popupDossierVerdictTag');
  const popupDossierReasoning = document.getElementById('popupDossierReasoning');
  const popupDossierStrengths = document.getElementById('popupDossierStrengths');
  const popupDossierGaps = document.getElementById('popupDossierGaps');
  const popupDossierQuestions = document.getElementById('popupDossierQuestions');
  let activeDossierCand = null;

  // Initialize
  checkActiveTab();
  fetchCurrentUser();
  loadRequisitions();
  setupAuthEvents();
  setupComposerEvents();
  setupDossierEvents();

  // 1. Detect Active Tab
  async function checkActiveTab() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs[0]) {
        activeTab = tabs[0];
        const url = activeTab.url || '';
        if (url.includes('monster.com')) {
          detectedPortal = 'Monster+';
          portalName.innerText = 'Monster+ Active';
          portalBadge.style.borderColor = '#7C3AED';
        } else if (url.includes('dice.com')) {
          detectedPortal = 'Dice';
          portalName.innerText = 'Dice Active';
          portalBadge.style.borderColor = '#EA580C';
        } else {
          detectedPortal = 'Web';
          portalName.innerText = 'Ready';
        }
      }
    } catch (err) {
      console.warn('Tab detection error:', err);
    }
  }

  // 2. Load Requisitions from SmartHire ATS
  function loadRequisitions() {
    if (window.SMARTHIRE_BUNDLED_JOBS && Array.isArray(window.SMARTHIRE_BUNDLED_JOBS) && window.SMARTHIRE_BUNDLED_JOBS.length > 0) {
      jobsList = window.SMARTHIRE_BUNDLED_JOBS;
      populateJobDropdown(jobsList);
    } else {
      jobSelect.innerHTML = '<option value="">Fetching live requisitions from ATS...</option>';
    }

    try {
      chrome.runtime.sendMessage({ action: 'FETCH_JOBS' }, (response) => {
        if (chrome.runtime.lastError) {
          if (!jobsList || jobsList.length === 0) useFallbackJobs();
          return;
        }
        if (response && response.success && Array.isArray(response.jobs) && response.jobs.length > 0) {
          jobsList = response.jobs;
          populateJobDropdown(response.jobs);
        } else if (!jobsList || jobsList.length === 0) {
          useFallbackJobs();
        }
      });
    } catch (e) {
      if (!jobsList || jobsList.length === 0) useFallbackJobs();
    }
  }

  function useFallbackJobs() {
    jobsList = (window.SMARTHIRE_BUNDLED_JOBS && window.SMARTHIRE_BUNDLED_JOBS.length > 0)
      ? window.SMARTHIRE_BUNDLED_JOBS
      : [
          { id: '159287', title: 'Microsoft .NET Developer', location: 'Richmond, VA', skills: ['.NET Core', 'C#', 'SQL Server', 'Angular', 'Web API', 'Azure'] },
          { id: '159023', title: 'Business Analyst', location: 'Columbia, SC', skills: ['SharePoint', 'MS Excel', 'Agile', 'Requirements Gathering', 'User Stories'] },
          { id: '159281', title: 'Information Technology Administrator', location: 'Madison, WI', skills: ['Windows Server', 'SOC Analyst', 'Active Directory', 'Azure Security'] }
        ];
    populateJobDropdown(jobsList);
  }

  function populateJobDropdown(jobs) {
    jobSelect.innerHTML = jobs.map(j => {
      const id = j.id || j.reqId;
      const title = j.title || j.positionTitle || 'Requisition';
      const loc = j.location || (j.city ? `${j.city}, ${j.state || ''}` : 'Remote');
      return `<option value="${id}">#${id} · ${title} (${loc})</option>`;
    }).join('');

    chrome.storage.local.get(['selected_req_id'], (result) => {
      if (result.selected_req_id) {
        const found = jobs.find(j => String(j.id || j.reqId) === String(result.selected_req_id));
        if (found) {
          jobSelect.value = result.selected_req_id;
          handleJobSelected(found);
          return;
        }
      }
      if (jobs.length > 0) {
        jobSelect.value = jobs[0].id || jobs[0].reqId;
        handleJobSelected(jobs[0]);
      }
    });
  }

  jobSelect.addEventListener('change', () => {
    const reqId = jobSelect.value;
    const found = jobsList.find(j => String(j.id || j.reqId) === String(reqId));
    if (found) {
      chrome.storage.local.set({ selected_req_id: reqId });
      handleJobSelected(found);
    }
  });

  refreshJobsBtn.addEventListener('click', () => {
    loadRequisitions();
  });

  function handleJobSelected(job) {
    selectedJob = job;
    jobMeta.style.display = 'flex';
    const loc = job.location || (job.city ? `${job.city}, ${job.state || ''}` : 'Remote');
    metaLocation.innerText = `Location: ${loc}`;

    const skills = Array.isArray(job.skills) ? job.skills.slice(0, 4).join(', ') : (job.skills || 'General');
    metaSkills.innerText = `Key Skills: ${skills}`;

    generateBooleanVariants();
  }

  // 3. Dynamic Boolean Query Generation with 3 Variants
  function generateBooleanVariants() {
    if (!selectedJob) return;
    const title = (selectedJob.title || selectedJob.positionTitle || 'Software Engineer')
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/#\d+/g, '')
      .trim();

    const rawSkills = Array.isArray(selectedJob.skills) ? selectedJob.skills : (selectedJob.skills ? String(selectedJob.skills).split(',') : []);
    const cleanSkills = rawSkills.map(s => s.trim()).filter(s => s.length > 1 && !s.toLowerCase().includes('communication'));

    let variant1 = '';
    let variant2 = '';
    let variant3 = '';

    // Variant 1: Core Targeted
    if (cleanSkills.length >= 2) {
      const top2 = cleanSkills.slice(0, 2).map(s => `"${s}"`).join(' AND ');
      variant1 = `("${title}") AND (${top2})`;
    } else if (cleanSkills.length === 1) {
      variant1 = `("${title}") AND ("${cleanSkills[0]}")`;
    } else {
      variant1 = `"${title}"`;
    }

    // Variant 2: Broad / Agile / Synonyms
    let altTitle = title;
    if (title.toLowerCase().includes('.net')) altTitle = 'C# Developer';
    else if (title.toLowerCase().includes('business analyst')) altTitle = 'Systems Analyst';
    else if (title.toLowerCase().includes('administrator')) altTitle = 'Systems Administrator';
    else if (title.toLowerCase().includes('frontend')) altTitle = 'UI Developer';

    const skillOrClause = cleanSkills.slice(0, 4).map(s => `"${s}"`).join(' OR ') || '"Agile" OR "Scrum"';
    variant2 = `("${title}" OR "${altTitle}") AND (${skillOrClause})`;

    // Variant 3: Regional / Public Sector Focus
    const locCity = (selectedJob.location || selectedJob.city || '').split(',')[0].trim();
    if (locCity && locCity.length > 2 && locCity.toLowerCase() !== 'remote') {
      variant3 = `("${title}") AND ("${locCity}" OR "State Government" OR "Public Sector")`;
    } else {
      variant3 = `("${title}") AND ("Enterprise" OR "Cloud" OR "Architect")`;
    }

    selectedJob._variants = { 1: variant1, 2: variant2, 3: variant3 };
    booleanQueryInput.value = selectedJob._variants[activeVariant] || variant1;
  }

  // Variant Pills Click
  variantPills.forEach(pill => {
    pill.addEventListener('click', () => {
      variantPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeVariant = parseInt(pill.getAttribute('data-variant'), 10) || 1;
      if (selectedJob && selectedJob._variants) {
        booleanQueryInput.value = selectedJob._variants[activeVariant];
      }
    });
  });

  // CSP-safe clipboard copy with fallback
  async function safeCopyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      console.warn('navigator.clipboard writeText failed, falling back:', e);
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      ta.style.left = '-9999px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length);
      const success = document.execCommand('copy');
      document.body.removeChild(ta);
      return !!success;
    } catch (e) {
      console.error('execCommand copy failed:', e);
      return false;
    }
  }

  // Copy Boolean Query
  copyQueryBtn.addEventListener('click', async () => {
    const q = booleanQueryInput.value;
    if (!q) return;
    const copied = await safeCopyText(q);
    if (copied) {
      const originalText = copyQueryBtn.querySelector('span').innerText;
      copyQueryBtn.querySelector('span').innerText = 'Copied!';
      setTimeout(() => {
        copyQueryBtn.querySelector('span').innerText = originalText;
      }, 2000);
    }
  });

  // Listen for background / content script progress updates
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'SCRAPE_PROGRESS') {
      scrapeNotice.innerText = request.message;
      scrapeBtnLabel.innerText = 'Extracting Details...';
    }
  });

  // 4. 1-Click Search Handlers (Monster+ & Dice)
  searchMonsterBtn.addEventListener('click', async () => {
    const title = selectedJob ? (selectedJob.title || selectedJob.positionTitle || '').replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim() : '';
    const query = booleanQueryInput.value;
    const location = selectedJob ? (selectedJob.location || selectedJob.city || '') : '';
    
    if (activeTab && activeTab.url && activeTab.url.includes('monster.com')) {
      sendAutoFillMessage(activeTab.id, title, query, location);
    } else {
      const encodedT = encodeURIComponent(title);
      const encodedQ = encodeURIComponent(query);
      const encodedL = encodeURIComponent(location);
      chrome.tabs.create({ url: `https://manage.monster.com/en-us/candidateSearch/job?title=${encodedT}&keywords=${encodedQ}&location=${encodedL}` });
    }
  });

  searchDiceBtn.addEventListener('click', async () => {
    const title = selectedJob ? (selectedJob.title || selectedJob.positionTitle || '').replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim() : '';
    const query = booleanQueryInput.value;
    const location = selectedJob ? (selectedJob.location || selectedJob.city || '') : '';

    if (activeTab && activeTab.url && activeTab.url.includes('dice.com')) {
      sendAutoFillMessage(activeTab.id, title, query, location);
    } else {
      const encodedQ = encodeURIComponent(query);
      const encodedL = encodeURIComponent(location);
      chrome.tabs.create({ url: `https://www.dice.com/employer/talent-search?q=${encodedQ}&location=${encodedL}` });
    }
  });

  function sendAutoFillMessage(tabId, title, query, location) {
    chrome.tabs.sendMessage(tabId, { action: 'AUTO_FILL_SEARCH', title, skillsQuery: query, query, location }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('Could not message tab, injecting fallback scripts...');
        injectScriptsAndAutoFill(tabId, title, query, location);
      } else if (response && response.success) {
        scrapeNotice.innerText = response.message || 'Search criteria injected into active tab!';
      }
    });
  }

  // 5. 1-Click Scrape Candidates on Current Page
  scrapePageBtn.addEventListener('click', async () => {
    scrapeBtnLabel.innerText = 'Extracting Candidates...';
    scrapeNotice.innerText = 'Looping through cards & extracting verified emails and phones...';

    if (!activeTab || !activeTab.id) {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs[0]) activeTab = tabs[0];
    }

    if (!activeTab) {
      scrapeNotice.innerText = 'No active browser tab found.';
      scrapeBtnLabel.innerText = '1-Click Scrape Current Page';
      return;
    }

    chrome.tabs.sendMessage(activeTab.id, { action: 'SCRAPE_PAGE' }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('Content script not answering, injecting programmatically...');
        injectScriptsAndScrape(activeTab.id);
      } else if (response && response.success) {
        handleScrapeResults(response.candidates);
      } else {
        scrapeNotice.innerText = response?.error || 'No candidates found on this page.';
        scrapeBtnLabel.innerText = '1-Click Scrape Current Page';
      }
    });
  });

  // Inject content scripts on the fly if needed
  async function injectScriptsAndScrape(tabId) {
    try {
      const isMonster = activeTab.url.includes('monster.com');
      const isDice = activeTab.url.includes('dice.com');

      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content_common.js']
      });

      if (isMonster) {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content_monster.js']
        });
      } else if (isDice) {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content_dice.js']
        });
      }

      // Retry message
      chrome.tabs.sendMessage(tabId, { action: 'SCRAPE_PAGE' }, (res) => {
        if (res && res.success) {
          handleScrapeResults(res.candidates);
        } else {
          scrapeNotice.innerText = 'Could not find candidate elements. Ensure you are on search results.';
          scrapeBtnLabel.innerText = '1-Click Scrape Current Page';
        }
      });
    } catch (err) {
      scrapeNotice.innerText = `Extraction notice: ${err.message}`;
      scrapeBtnLabel.innerText = '1-Click Scrape Current Page';
    }
  }

  async function injectScriptsAndAutoFill(tabId, title, query, location) {
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['content_common.js'] });
      if (activeTab.url.includes('monster.com')) {
        await chrome.scripting.executeScript({ target: { tabId }, files: ['content_monster.js'] });
      } else if (activeTab.url.includes('dice.com')) {
        await chrome.scripting.executeScript({ target: { tabId }, files: ['content_dice.js'] });
      }
      chrome.tabs.sendMessage(tabId, { action: 'AUTO_FILL_SEARCH', title, skillsQuery: query, query, location });
    } catch (e) {
      console.warn('Auto fill injection err:', e);
    }
  }

  // Handle Scraped Candidate Results
  function handleScrapeResults(candidates) {
    scrapeBtnLabel.innerText = '1-Click Scrape Current Page';
    if (!candidates || candidates.length === 0) {
      scrapeNotice.innerText = 'No candidates detected on the active page. Try opening candidate search results.';
      countTag.innerText = '0 Candidates';
      tableSection.style.display = 'none';
      return;
    }

    scrapedCandidates = candidates;
    selectedCandidateIds = new Set(candidates.map(c => c.id));
    countTag.innerText = `${candidates.length} Candidates`;
    scrapeNotice.innerText = `Successfully extracted ${candidates.length} profiles from ${detectedPortal}.`;

    renderTable();
    tableSection.style.display = 'block';
  }

  // Render Candidates Table
  function renderTable() {
    candidatesTableBody.innerHTML = scrapedCandidates.map((c, idx) => {
      const isSelected = selectedCandidateIds.has(c.id);
      const skillsStr = Array.isArray(c.skills) ? c.skills.join(', ') : (c.skills || '');
      const hasEmail = c.email && c.email.includes('@') && !c.email.includes('@monster.talent') && c.email !== 'Not Disclosed';
      const isSent = (c.email && sentCandidateEmails.has(c.email.toLowerCase())) || (c.name && sentCandidateEmails.has(c.name.toLowerCase()));
      const aiScore = c.aiMatch ? c.aiMatch.score : (c.matchScore || null);
      const aiVerdict = c.aiMatch ? c.aiMatch.verdict : (aiScore ? (aiScore >= 85 ? 'STRONG FIT' : (aiScore >= 70 ? 'GOOD FIT' : 'MODERATE FIT')) : null);
      const aiColor = c.aiMatch ? c.aiMatch.color : (aiScore ? (aiScore >= 85 ? '#059669' : (aiScore >= 70 ? '#2563EB' : '#D97706')) : '#7C3AED');

      return `
        <tr data-id="${c.id}">
          <td style="text-align:center;">
            <input type="checkbox" class="candidate-row-checkbox" data-id="${c.id}" ${isSelected ? 'checked' : ''}>
          </td>
          <td style="color:#64748B; font-weight:600;">${idx + 1}</td>
          <td style="font-weight:700; color:#0F172A;" title="${c.name}">${c.name}</td>
          <td title="${c.title}">${c.title}</td>
          <td style="color:#2563EB;" title="${c.email}">${c.email || '—'}</td>
          <td style="font-family:monospace;" title="${c.phone}">${c.phone || '—'}</td>
          <td title="${c.location}">${c.location || 'US'}</td>
          <td>${c.experience || '—'}</td>
          <td title="${skillsStr}">${skillsStr || '—'}</td>
          <td><span style="font-size:10px; font-weight:700; color:#475569;">${c.source || detectedPortal}</span></td>
          <td style="text-align:center;">
            ${aiScore ? `
              <button type="button" class="btn-popup-dossier" data-idx="${idx}" style="border:none; cursor:pointer; background:${aiColor}15; color:${aiColor}; border:1px solid ${aiColor}35; font-size:10px; font-weight:800; padding:2px 6px; border-radius:10px; display:inline-flex; align-items:center; gap:3px;">
                <span>${aiScore}%</span>
                <span style="font-size:8.5px; opacity:0.85;">Dossier ➔</span>
              </button>
            ` : `
              <button type="button" class="btn-popup-single-ai" data-idx="${idx}" style="border:none; cursor:pointer; background:#F5F3FF; color:#7C3AED; border:1px solid #DDD6FE; font-size:9.5px; font-weight:700; padding:2px 6px; border-radius:8px;">
                Run AI
              </button>
            `}
          </td>
          <td style="text-align:center;">
            ${hasEmail ? `
              <button type="button" class="btn-popup-outreach" data-idx="${idx}" style="background:#2563EB; color:#fff; border:none; border-radius:4px; padding:3px 8px; font-size:10px; font-weight:600; cursor:pointer;">
                ${isSent ? '✓ Sent' : '✉ Send JD'}
              </button>
            ` : '<span style="color:#94A3B8; font-size:9.5px;">No Email</span>'}
          </td>
        </tr>
      `;
    }).join('');

    updateSelectionBadges();

    // Attach row checkbox handlers
    document.querySelectorAll('.candidate-row-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        if (e.target.checked) {
          selectedCandidateIds.add(id);
        } else {
          selectedCandidateIds.delete(id);
        }
        updateSelectionBadges();
      });
    });

    // Attach outreach button handlers
    document.querySelectorAll('.btn-popup-outreach').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        const cand = scrapedCandidates[idx];
        if (cand) {
          openPopupComposer(cand, selectedJob);
        }
      });
    });

    // Attach dossier button handlers
    document.querySelectorAll('.btn-popup-dossier').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        const cand = scrapedCandidates[idx];
        if (cand) {
          openPopupAiDossier(cand, selectedJob);
        }
      });
    });

    // Attach single AI match handlers
    document.querySelectorAll('.btn-popup-single-ai').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        const cand = scrapedCandidates[idx];
        if (cand) {
          runPopupSingleAiMatch(cand, selectedJob);
        }
      });
    });
  }

  // Select all handler
  selectAllCheckbox.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      selectedCandidateIds = new Set(scrapedCandidates.map(c => c.id));
    } else {
      selectedCandidateIds.clear();
    }
    document.querySelectorAll('.candidate-row-checkbox').forEach(cb => {
      cb.checked = isChecked;
    });
    updateSelectionBadges();
  });

  function updateSelectionBadges() {
    const count = selectedCandidateIds.size;
    selectedCountBadge.innerText = count;
    selectAllCheckbox.checked = count === scrapedCandidates.length && count > 0;
    const validEmailsCount = scrapedCandidates.filter(c => 
      selectedCandidateIds.has(c.id) && c.email && c.email.includes('@') && !c.email.includes('@monster.talent') && c.email !== 'Not Disclosed'
    ).length;
    if (popupBulkCountBadge) popupBulkCountBadge.innerText = validEmailsCount;
  }

  // 6. Action 1: Copy to Excel (TSV)
  copyTsvBtn.addEventListener('click', async () => {
    const selected = scrapedCandidates.filter(c => selectedCandidateIds.has(c.id));
    if (selected.length === 0) {
      alert('Please select at least one candidate to copy.');
      return;
    }

    const headers = ['Sl. No', 'Candidate Name', 'Title / Role', 'Email', 'Phone', 'Location', 'Experience', 'Skills', 'Source', 'Profile Link'];
    const rows = selected.map((c, i) => [
      i + 1,
      c.name,
      c.title,
      c.email || '',
      c.phone || '',
      c.location || '',
      c.experience || '',
      (c.skills || []).join(', '),
      c.source || detectedPortal,
      c.profileUrl || ''
    ]);

    const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    const copied = await safeCopyText(tsv);
    if (copied) {
      const orig = copyTsvBtn.innerText;
      copyTsvBtn.innerText = '✓ Copied TSV!';
      setTimeout(() => { copyTsvBtn.innerText = orig; }, 2500);
    } else {
      alert('Failed to copy to clipboard. Please check browser clipboard permissions.');
    }
  });

  // Action 2: Download CSV
  downloadCsvBtn.addEventListener('click', () => {
    const selected = scrapedCandidates.filter(c => selectedCandidateIds.has(c.id));
    if (selected.length === 0) {
      alert('Please select at least one candidate to download.');
      return;
    }

    const headers = ['Sl No', 'Candidate Name', 'Title', 'Email', 'Phone', 'Location', 'Experience', 'Skills', 'Source', 'Profile Link'];
    const escapeCsv = (val) => {
      if (val == null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = selected.map((c, i) => [
      i + 1,
      escapeCsv(c.name),
      escapeCsv(c.title),
      escapeCsv(c.email),
      escapeCsv(c.phone),
      escapeCsv(c.location),
      escapeCsv(c.experience),
      escapeCsv((c.skills || []).join(', ')),
      escapeCsv(c.source || detectedPortal),
      escapeCsv(c.profileUrl || '')
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const jobName = selectedJob ? (selectedJob.title || selectedJob.id).replace(/[^a-zA-Z0-9]/g, '_') : 'Candidates';
    a.href = url;
    a.download = `SmartHire_${jobName}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Action 3: 1-Click Bulk Import to SmartHire ATS
  importAtsBtn.addEventListener('click', () => {
    if (!isUserAuthenticated || !currentUser) {
      alert('Authentication required: Please sign in with your SmartHire ATS recruiter credentials.');
      if (popupLoginCard) popupLoginCard.style.display = 'block';
      return;
    }

    const selected = scrapedCandidates.filter(c => selectedCandidateIds.has(c.id));
    if (selected.length === 0) {
      alert('Please select candidates to import.');
      return;
    }

    importFeedback.style.color = '#2563EB';
    importFeedback.innerText = `Importing ${selected.length} candidate(s) into SmartHire ATS...`;

    const targetReqId = selectedJob ? (selectedJob.id || selectedJob.reqId) : null;

    chrome.runtime.sendMessage({
      action: 'BULK_IMPORT_ATS',
      payload: {
        candidates: selected,
        targetReqId,
        source: `${detectedPortal} Copilot Extension`,
        recruiterEmail: currentUser.email,
        recruiterName: currentUser.name
      }
    }, (response) => {
      if (response && response.success && response.data) {
        importFeedback.style.color = '#059669';
        importFeedback.innerHTML = `✓ Successfully imported ${response.data.importedCount} new (${response.data.updatedCount} updated) candidates into ATS! <a href="${API_BASE}" target="_blank" style="color:#059669; text-decoration:underline;">View in ATS Pipeline</a>`;
      } else {
        importFeedback.style.color = '#DC2626';
        importFeedback.innerText = `Error: ${response?.error || 'Failed to import candidates'}`;
      }
    });
  });

  // Recruiter Identity & Authentication
  function fetchCurrentUser() {
    try {
      chrome.runtime.sendMessage({ action: 'GET_CURRENT_USER' }, (res) => {
        if (res && res.success && res.user && res.isLoggedIn) {
          currentUser = res.user;
          isUserAuthenticated = true;
        } else {
          currentUser = null;
          isUserAuthenticated = false;
        }
        updateRecruiterBarUI();
      });
    } catch (e) {
      currentUser = null;
      isUserAuthenticated = false;
      updateRecruiterBarUI();
    }
  }

  function updateRecruiterBarUI() {
    if (isUserAuthenticated && currentUser) {
      if (popupRecruiterName) popupRecruiterName.innerText = currentUser.name || 'Recruiter';
      if (popupRecruiterEmail) popupRecruiterEmail.innerText = `(${currentUser.email})`;
      if (popupAuthToggle) {
        popupAuthToggle.innerText = 'Sign Out';
        popupAuthToggle.style.color = '#F87171';
      }
    } else {
      if (popupRecruiterName) popupRecruiterName.innerText = 'Not Signed In';
      if (popupRecruiterEmail) popupRecruiterEmail.innerText = '(Login Required)';
      if (popupAuthToggle) {
        popupAuthToggle.innerText = 'Sign In';
        popupAuthToggle.style.color = '#38BDF8';
      }
    }
  }

  function setupAuthEvents() {
    if (popupAuthToggle) {
      popupAuthToggle.addEventListener('click', () => {
        if (isUserAuthenticated && currentUser) {
          if (confirm(`Sign out of SmartHire ATS (${currentUser.name})?`)) {
            chrome.runtime.sendMessage({ action: 'LOGOUT_USER' }, () => {
              currentUser = null;
              isUserAuthenticated = false;
              updateRecruiterBarUI();
            });
          }
        } else {
          popupLoginCard.style.display = (popupLoginCard.style.display === 'none' || !popupLoginCard.style.display) ? 'block' : 'none';
        }
      });
    }

    if (popupCloseLoginBtn) {
      popupCloseLoginBtn.addEventListener('click', () => {
        popupLoginCard.style.display = 'none';
      });
    }

    if (popupDoLoginBtn) {
      popupDoLoginBtn.addEventListener('click', performPopupLogin);
    }
  }

  function performPopupLogin() {
    const email = popupLoginEmail.value.trim();
    const password = popupLoginPass.value.trim();

    if (!email || !password) {
      popupLoginMsg.style.display = 'block';
      popupLoginMsg.style.color = '#DC2626';
      popupLoginMsg.innerText = 'Please enter both email and password';
      return;
    }

    popupDoLoginBtn.disabled = true;
    popupDoLoginBtn.innerText = 'Signing In...';
    popupLoginMsg.style.display = 'block';
    popupLoginMsg.style.color = '#2563EB';
    popupLoginMsg.innerText = 'Authenticating with SmartHire ATS...';

    chrome.runtime.sendMessage({ action: 'LOGIN_USER', email, password }, (res) => {
      popupDoLoginBtn.disabled = false;
      popupDoLoginBtn.innerText = 'Sign In';

      if (res && res.success && res.user) {
        currentUser = res.user;
        isUserAuthenticated = true;
        updateRecruiterBarUI();
        popupLoginMsg.style.color = '#059669';
        popupLoginMsg.innerText = `✓ Welcome, ${currentUser.name}!`;
        setTimeout(() => {
          popupLoginCard.style.display = 'none';
          popupLoginMsg.style.display = 'none';
        }, 1200);
      } else {
        popupLoginMsg.style.color = '#DC2626';
        popupLoginMsg.innerText = res?.message || 'Invalid credentials';
      }
    });
  }

  // Sanitizers: Stripping Rates & Requisition IDs
  function sanitizeJobDescription(desc) {
    if (!desc) return '';
    let text = String(desc);
    // 1. Strip rates and pay numbers per user requirement
    text = text.replace(/(bill\s*rate|pay\s*rate|hourly\s*rate|rate|salary|budget|compensation)\s*[:=-]?\s*\$?\s*\d+(\.\d+)?(\s*[\/\-]\s*(hr|hour|yr|year|annum))?/gi, '');
    text = text.replace(/\$\d+(\.\d+)?\s*[\/\-]\s*(hr|hour|yr|year|annum)/gi, '');
    text = text.replace(/\$\d{2,3}(,\d{3})*(\s*[\/\-]\s*(hr|hour|yr|year|annum))?/gi, '');
    text = text.replace(/\b\d{2,3}\s*[\/\-]\s*hr\b/gi, '');
    text = text.replace(/\b\d{2,3}\s*-\s*\d{2,3}\s*[\/\-]\s*hr\b/gi, '');
    // 2. Strip requisition numbers per user requirement
    text = text.replace(/\b(req|requisition|job\s*id|req\s*#|req\s*id)\s*[:#=-]?\s*#?\d+/gi, '');
    text = text.replace(/#\d{5,8}\b/g, '');
    text = text.replace(/\b159\d{3}\b/g, '');
    // 3. Strip internal submission deadlines (do NOT use .*$ as that wipes all remaining text on single-line strings)
    text = text.replace(/Submission deadline\s*:\s*[\d\/\:\sAMPamp]+/gi, '');
    text = text.replace(/Start date\s*:\s*\d{1,2}\/\d{1,2}\/\d{2,4}/gi, '');
    text = text.replace(/End Date\s*:\s*\d{1,2}\/\d{1,2}\/\d{2,4}/gi, '');
    // 4. Structure sections and bullet points cleanly
    text = text.replace(/\s*Description:\s*/gi, '\n\nJob Responsibilities & Scope:\n');
    text = text.replace(/\s*Note:\s*/gi, '\n\nKey Position Notes:\n');
    text = text.replace(/([.?!])\s*•\s*/g, '$1\n\n• ');
    text = text.replace(/\s*•\s*/g, '\n• ');
    text = text.replace(/([.?!])\s*\*\s*/g, '$1\n\n* ');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n{3,}/g, '\n\n').trim();
    return text;
  }

  function cleanJobTitle(title) {
    if (!title) return 'Technical Specialist';
    return String(title)
      .replace(/#\d+/g, '')
      .replace(/REQ-\d+/gi, '')
      .replace(/\b159\d{3}\b/g, '')
      .replace(/\(\s*#?\d+\s*\)/g, '')
      .trim();
  }

  function generateOutreachDraft(candidate, job) {
    const rawName = (candidate.name || 'Candidate').replace(/\(.*\)/g, '').trim();
    const firstName = rawName.split(' ')[0] || 'there';
    const cleanTitle = cleanJobTitle(job ? job.title : 'Technical Specialist');
    const location = job?.location || 'United States (Remote / Onsite as required)';
    const skills = Array.isArray(job?.skills) ? job.skills.slice(0, 5).join(', ') : '';
    const cleanDesc = sanitizeJobDescription(job?.description || job?.fullDescription || job?.rawDescription || '');

    const subject = `Career Opportunity: ${cleanTitle} — COOLSOFT LLC`;

    const recruiterDisplayName = currentUser ? currentUser.name : 'Technical Recruiter';
    const recruiterWorkEmail = currentUser ? currentUser.email : 'recruiting@coolsofttech.com';

    const body = `Hi ${firstName},

I hope this email finds you well.

I came across your profile and was very impressed by your background${skills ? ` in ${skills}` : ''}. We currently have an immediate opening for a ${cleanTitle} role that aligns closely with your expertise.

--- Position Details ---
Role: ${cleanTitle}
Location: ${location}
Work Authorization: US Citizen / Green Card / Authorized to Work in US

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

  // Outreach Composer Modal Events
  function setupComposerEvents() {
    if (popupComposerClose) popupComposerClose.addEventListener('click', closePopupComposer);
    if (popupCompCancel) popupCompCancel.addEventListener('click', closePopupComposer);
    if (popupCompSend) popupCompSend.addEventListener('click', sendPopupOutreach);

    if (popupBulkOutreachBtn) popupBulkOutreachBtn.addEventListener('click', openPopupBulkComposer);
    if (popupBulkClose) popupBulkClose.addEventListener('click', closePopupBulkComposer);
    if (popupBulkCancel) popupBulkCancel.addEventListener('click', closePopupBulkComposer);
    if (popupBulkSend) popupBulkSend.addEventListener('click', sendPopupBulkOutreach);
  }

  function openPopupComposer(candidate, job) {
    if (!isUserAuthenticated || !currentUser) {
      alert('Authentication required: Please sign in with your SmartHire ATS recruiter credentials.');
      if (popupLoginCard) popupLoginCard.style.display = 'block';
      return;
    }

    if (!candidate) return;
    activePopupCand = candidate;
    const targetJob = job || selectedJob;
    const draft = generateOutreachDraft(candidate, targetJob);

    if (popupCompSender) popupCompSender.innerText = `${currentUser.name} <${currentUser.email}>`;
    if (popupCompName) popupCompName.value = draft.candidateName;
    if (popupCompEmail) popupCompEmail.value = draft.to;
    if (popupCompTitle) popupCompTitle.value = draft.cleanTitle;
    if (popupCompSubject) popupCompSubject.value = draft.subject;
    if (popupCompBody) popupCompBody.value = draft.body;
    if (popupCompStatus) popupCompStatus.innerHTML = '';
    if (popupCompSend) {
      popupCompSend.disabled = false;
      popupCompSend.innerText = 'Send Email';
    }

    if (popupComposerOverlay) popupComposerOverlay.style.display = 'flex';
  }

  function closePopupComposer() {
    if (popupComposerOverlay) popupComposerOverlay.style.display = 'none';
    activePopupCand = null;
  }

  function sendPopupOutreach() {
    if (!isUserAuthenticated || !currentUser) {
      alert('Authentication required.');
      return;
    }

    const to = popupCompEmail?.value.trim();
    const subject = popupCompSubject?.value.trim();
    const body = popupCompBody?.value.trim();

    if (!to || !to.includes('@')) {
      if (popupCompStatus) popupCompStatus.innerHTML = '<span style="color:#DC2626;">Valid candidate email required</span>';
      return;
    }
    if (!subject || !body) {
      if (popupCompStatus) popupCompStatus.innerHTML = '<span style="color:#DC2626;">Subject and message body required</span>';
      return;
    }

    popupCompSend.disabled = true;
    popupCompSend.innerText = 'Sending...';
    if (popupCompStatus) popupCompStatus.innerHTML = `<span style="color:#2563EB;">Delivering email to ${to}...</span>`;

    chrome.runtime.sendMessage({
      action: 'SEND_OUTREACH_EMAIL',
      payload: {
        recruiterEmail: currentUser.email,
        recruiterName: currentUser.name,
        to,
        subject,
        body,
        html: body.replace(/\n/g, '<br>')
      }
    }, (res) => {
      if (chrome.runtime.lastError) {
        popupCompSend.disabled = false;
        popupCompSend.innerText = 'Send Email';
        if (popupCompStatus) popupCompStatus.innerHTML = `<span style="color:#DC2626;">Error: ${chrome.runtime.lastError.message}</span>`;
        return;
      }

      if (res && res.success) {
        if (popupCompStatus) popupCompStatus.innerHTML = `<span style="color:#059669; font-weight:700;">✓ Email delivered from ${currentUser.email}!</span>`;
        sentCandidateEmails.add(to.toLowerCase());
        if (activePopupCand) {
          sentCandidateEmails.add((activePopupCand.name || '').toLowerCase());
        }
        renderTable();
        setTimeout(() => {
          closePopupComposer();
        }, 1600);
      } else {
        popupCompSend.disabled = false;
        popupCompSend.innerText = 'Retry Send';
        if (popupCompStatus) popupCompStatus.innerHTML = `<span style="color:#DC2626; font-weight:600;">Failed: ${res?.message || 'SMTP delivery rejected'}</span>`;
      }
    });
  }

  function openPopupBulkComposer() {
    if (!isUserAuthenticated || !currentUser) {
      alert('Authentication required: Please sign in with your SmartHire ATS credentials to send bulk emails.');
      if (popupLoginCard) popupLoginCard.style.display = 'block';
      return;
    }

    const validCandidates = scrapedCandidates.filter(c => 
      selectedCandidateIds.has(c.id) && c.email && c.email.includes('@') && !c.email.includes('@monster.talent') && c.email !== 'Not Disclosed'
    );

    if (validCandidates.length === 0) {
      alert('Please select at least one candidate with a valid email address.');
      return;
    }

    if (popupBulkSender) popupBulkSender.innerText = `${currentUser.name} <${currentUser.email}>`;
    if (popupBulkRecipientsCount) popupBulkRecipientsCount.innerText = validCandidates.length;

    if (popupBulkRecipientsChips) {
      popupBulkRecipientsChips.innerHTML = validCandidates.map(c => `
        <span style="background:#EFF6FF; color:#1E40AF; border:1px solid #BFDBFE; font-size:10px; font-weight:600; padding:1px 6px; border-radius:3px; display:inline-block;">
          ${c.name} &lt;${c.email}&gt;
        </span>
      `).join('');
    }

    const cleanTitle = cleanJobTitle(selectedJob ? selectedJob.title : 'Technical Specialist');
    const location = selectedJob?.location || 'United States (Remote / Onsite as required)';
    const cleanDesc = sanitizeJobDescription(selectedJob?.description || selectedJob?.fullDescription || selectedJob?.rawDescription || '');

    if (popupBulkTitle) popupBulkTitle.value = cleanTitle;
    if (popupBulkSubject) popupBulkSubject.value = `Career Opportunity: ${cleanTitle} — COOLSOFT LLC`;

    if (popupBulkBody) {
      popupBulkBody.value = `Hi {{firstName}},

I hope this email finds you well.

I came across your profile and was very impressed by your background. We currently have an immediate opening for a ${cleanTitle} role that aligns closely with your expertise.

--- Position Details ---
Role: ${cleanTitle}
Location: ${location}
Work Authorization: US Citizen / Green Card / Authorized to Work in US

${cleanDesc}

If you are open to exploring this opportunity, please reply to this email with your updated resume, or let me know a convenient time for a brief introductory call.

Best regards,

${currentUser.name}
Technical Recruiter | COOLSOFT LLC
Email: ${currentUser.email}
Website: http://www.coolsofttech.com`;
    }

    if (popupBulkProgressContainer) popupBulkProgressContainer.style.display = 'none';
    if (popupBulkLiveLog) popupBulkLiveLog.innerHTML = '';
    if (popupBulkStatus) popupBulkStatus.innerHTML = '';
    if (popupBulkSend) {
      popupBulkSend.disabled = false;
      popupBulkSend.innerText = `Send Bulk Emails (${validCandidates.length})`;
    }

    if (popupBulkOverlay) popupBulkOverlay.style.display = 'flex';
  }

  function closePopupBulkComposer() {
    if (popupBulkOverlay) popupBulkOverlay.style.display = 'none';
  }

  async function sendPopupBulkOutreach() {
    if (!isUserAuthenticated || !currentUser) {
      alert('Authentication required.');
      return;
    }

    const validCandidates = scrapedCandidates.filter(c => 
      selectedCandidateIds.has(c.id) && c.email && c.email.includes('@') && !c.email.includes('@monster.talent') && c.email !== 'Not Disclosed'
    );

    if (validCandidates.length === 0) return;

    const subjectTemplate = popupBulkSubject?.value.trim();
    const bodyTemplate = popupBulkBody?.value.trim();

    if (!subjectTemplate || !bodyTemplate) {
      if (popupBulkStatus) popupBulkStatus.innerHTML = '<span style="color:#DC2626;">Subject and message template required</span>';
      return;
    }

    popupBulkSend.disabled = true;
    if (popupBulkProgressContainer) popupBulkProgressContainer.style.display = 'block';

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < validCandidates.length; i++) {
      const cand = validCandidates[i];
      const firstName = (cand.name || 'there').split(' ')[0] || 'there';
      const personalizedBody = bodyTemplate.replace(/\{\{firstName\}\}/g, firstName);

      popupBulkSend.innerText = `Sending ${i + 1} of ${validCandidates.length}...`;
      const pct = Math.round(((i + 1) / validCandidates.length) * 100);
      if (popupBulkProgressBar) popupBulkProgressBar.style.width = `${pct}%`;

      try {
        const res = await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            action: 'SEND_OUTREACH_EMAIL',
            payload: {
              recruiterEmail: currentUser.email,
              recruiterName: currentUser.name,
              to: cand.email,
              subject: subjectTemplate,
              body: personalizedBody,
              html: personalizedBody.replace(/\n/g, '<br>')
            }
          }, resolve);
        });

        if (res && res.success) {
          successCount++;
          sentCandidateEmails.add(cand.email.toLowerCase());
          sentCandidateEmails.add((cand.name || '').toLowerCase());
          if (popupBulkLiveLog) {
            const row = document.createElement('div');
            row.style.color = '#059669';
            row.innerText = `✓ [${i+1}/${validCandidates.length}] Delivered to ${cand.name} (${cand.email})`;
            popupBulkLiveLog.appendChild(row);
            popupBulkLiveLog.scrollTop = popupBulkLiveLog.scrollHeight;
          }
        } else {
          failCount++;
          if (popupBulkLiveLog) {
            const row = document.createElement('div');
            row.style.color = '#DC2626';
            row.innerText = `✗ [${i+1}/${validCandidates.length}] Failed for ${cand.name}: ${res?.message || 'Error'}`;
            popupBulkLiveLog.appendChild(row);
            popupBulkLiveLog.scrollTop = popupBulkLiveLog.scrollHeight;
          }
        }
      } catch (err) {
        failCount++;
      }

      await new Promise(r => setTimeout(r, 350));
    }

    if (popupBulkStatus) {
      popupBulkStatus.innerHTML = `<span style="color:#059669; font-weight:700;">✓ Dispatched: ${successCount} sent, ${failCount} failed</span>`;
    }
    popupBulkSend.innerText = 'Completed!';
    renderTable();

    setTimeout(() => {
      closePopupBulkComposer();
    }, 2200);
  }

  // -------------------------------------------------------------
  // AI Resume-to-JD Matching & Dossier Handlers
  // -------------------------------------------------------------
  function setupDossierEvents() {
    if (popupDossierClose) popupDossierClose.addEventListener('click', closePopupAiDossier);
    if (popupDossierCloseBtn) popupDossierCloseBtn.addEventListener('click', closePopupAiDossier);
    if (popupDossierOutreachBtn) {
      popupDossierOutreachBtn.addEventListener('click', () => {
        if (activeDossierCand) {
          closePopupAiDossier();
          openPopupComposer(activeDossierCand, selectedJob);
        }
      });
    }
    if (popupAiMatchBtn) {
      popupAiMatchBtn.addEventListener('click', runPopupAiFitAnalysis);
    }
  }

  function openPopupAiDossier(cand, job) {
    activeDossierCand = cand;
    const targetJob = job || selectedJob;
    const match = cand.aiMatch || {
      score: cand.matchScore || 70,
      verdict: cand.matchScore ? (cand.matchScore >= 85 ? 'STRONG FIT' : (cand.matchScore >= 70 ? 'GOOD FIT' : 'MODERATE FIT')) : 'EVALUATED',
      color: cand.matchScore ? (cand.matchScore >= 85 ? '#059669' : (cand.matchScore >= 70 ? '#2563EB' : '#D97706')) : '#7C3AED',
      reasoning: cand.aiReasoning || 'AI matching completed based on candidate role and required skills.',
      strengths: cand.strengths || ['Demonstrated background matching target position requirements'],
      gaps: cand.gaps || ['No critical disqualifying gaps detected'],
      interviewQuestions: [
        'Can you detail your hands-on experience relevant to this role?',
        'What was your primary technical contribution in your last project?'
      ]
    };

    if (popupDossierCandName) popupDossierCandName.innerText = cand.name || 'Candidate Profile';
    if (popupDossierCandRole) popupDossierCandRole.innerText = `${cand.title || 'Specialist'} · ${cand.location || 'United States'}`;
    if (popupDossierJobTitle) popupDossierJobTitle.innerText = `Target: ${targetJob ? targetJob.title : 'Selected Requisition'}`;
    if (popupDossierScoreVal) {
      popupDossierScoreVal.innerText = `${match.score}% Fit`;
      popupDossierScoreVal.style.color = match.color || '#059669';
      popupDossierScoreVal.style.borderColor = (match.color || '#059669') + '40';
      popupDossierScoreVal.style.background = (match.color || '#059669') + '15';
    }
    if (popupDossierVerdictTag) {
      popupDossierVerdictTag.innerText = match.verdict || 'EVALUATED';
      popupDossierVerdictTag.style.color = match.color || '#059669';
    }
    if (popupDossierReasoning) popupDossierReasoning.innerText = match.reasoning || 'No reasoning available.';
    if (popupDossierStrengths) {
      popupDossierStrengths.innerHTML = (match.strengths && match.strengths.length > 0)
        ? match.strengths.map(s => `<div>• ${s}</div>`).join('')
        : '<div>• Strong foundational experience aligned with target role</div>';
    }
    if (popupDossierGaps) {
      popupDossierGaps.innerHTML = (match.gaps && match.gaps.length > 0)
        ? match.gaps.map(g => `<div>• ${g}</div>`).join('')
        : '<div>• No critical gaps detected against job profile</div>';
    }
    if (popupDossierQuestions) {
      popupDossierQuestions.innerHTML = (match.interviewQuestions && match.interviewQuestions.length > 0)
        ? match.interviewQuestions.map((q, qIdx) => `<div><strong>Q${qIdx + 1}:</strong> ${q}</div>`).join('')
        : '<div>• Can you summarize your primary technical contributions in your recent project?</div>';
    }

    if (popupAiDossierOverlay) popupAiDossierOverlay.style.display = 'flex';
  }

  function closePopupAiDossier() {
    if (popupAiDossierOverlay) popupAiDossierOverlay.style.display = 'none';
  }

  async function runPopupAiFitAnalysis() {
    if (!isUserAuthenticated || !currentUser) {
      alert('Authentication Required: Please sign in with your SmartHire ATS credentials to run AI match analysis.');
      if (popupLoginCard) popupLoginCard.style.display = 'block';
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

    const origText = popupAiMatchBtn ? popupAiMatchBtn.innerText : '';
    if (popupAiMatchBtn) {
      popupAiMatchBtn.disabled = true;
      popupAiMatchBtn.style.opacity = '0.7';
      popupAiMatchBtn.innerText = `Analyzing ${scrapedCandidates.length} with AI...`;
    }

    try {
      const payload = {
        candidates: scrapedCandidates.map((c, i) => ({
          id: c.id || `scraped-${i}`,
          name: c.name,
          title: c.title,
          role: c.title,
          skills: c.skills,
          experience: c.experience,
          summary: c.summary,
          location: c.location
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

      const res = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'AI_MATCH_BATCH',
          payload
        }, resolve);
      });

      if (res && res.success && Array.isArray(res.matches)) {
        res.matches.forEach((m, idx) => {
          if (scrapedCandidates[idx]) {
            scrapedCandidates[idx].aiMatch = m;
            scrapedCandidates[idx].matchScore = m.score;
            scrapedCandidates[idx].strengths = m.strengths;
            scrapedCandidates[idx].gaps = m.gaps;
            scrapedCandidates[idx].aiReasoning = m.reasoning;
          }
        });

        // Sort candidates by AI matchScore descending
        scrapedCandidates.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

        renderTable();
        if (popupAiMatchBtn) popupAiMatchBtn.innerText = `✓ Ranked by AI (${scrapedCandidates.length})`;
      } else {
        alert('AI Matching returned: ' + (res?.error || 'Fallback applied'));
        if (popupAiMatchBtn) popupAiMatchBtn.innerText = origText;
      }
    } catch (err) {
      alert('AI Match error: ' + err.message);
      if (popupAiMatchBtn) popupAiMatchBtn.innerText = origText;
    } finally {
      if (popupAiMatchBtn) {
        popupAiMatchBtn.disabled = false;
        popupAiMatchBtn.style.opacity = '1';
      }
    }
  }

  async function runPopupSingleAiMatch(candidate, job) {
    if (!isUserAuthenticated || !currentUser) {
      alert('Authentication required: Please sign in.');
      if (popupLoginCard) popupLoginCard.style.display = 'block';
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
          summary: candidate.summary,
          location: candidate.location
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

      const res = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'AI_MATCH_CANDIDATE', payload }, resolve);
      });

      if (res && res.success && res.match) {
        candidate.aiMatch = res.match;
        candidate.matchScore = res.match.score;
        candidate.strengths = res.match.strengths;
        candidate.gaps = res.match.gaps;
        candidate.aiReasoning = res.match.reasoning;
        renderTable();
        openPopupAiDossier(candidate, targetJob);
      }
    } catch (e) {
      alert('AI Match error: ' + e.message);
    }
  }
});
