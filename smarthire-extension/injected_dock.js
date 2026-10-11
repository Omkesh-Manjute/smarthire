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

  function initDock() {
    // 1. Discreet 38px Shield Logo Trigger (No long text strip!)
    const trigger = document.createElement('div');
    trigger.id = 'smarthire-copilot-trigger';
    trigger.title = 'SmartHire ATS Sourcing Copilot v3.6 (Click to Open)';
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
          <span style="background:#1E293B; color:#93C5FD; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; border:1px solid #334155;">v3.6 Live</span>
        </div>
        <button id="smarthire-drawer-close" style="background:none; border:none; color:#94A3B8; font-size:22px; cursor:pointer; line-height:1; padding:0 4px;">&times;</button>
      </div>

      <!-- Navigation Tabs: Quick Sourcing vs Browserflow Studio -->
      <div class="smarthire-nav-tabs">
        <button class="smarthire-tab-btn active" id="tab-btn-quick">⚡ Quick Sourcing</button>
        <button class="smarthire-tab-btn" id="tab-btn-flow">🛠 Browserflow Studio</button>
      </div>

      <div class="smarthire-drawer-body">
        
        <!-- VIEW 1: QUICK SOURCING TAB -->
        <div id="view-quick-sourcing">
          <!-- Requisition Selector Card -->
          <div class="smarthire-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <label class="smarthire-label" style="margin-bottom:0;">ATS Target Requisition</label>
              <span id="smarthire-job-count-badge" style="font-size:10px; color:#2563EB; font-weight:700;">${allJobs.length} Jobs</span>
            </div>

            <!-- Instant Search Input for 180+ Requisitions -->
            <input 
              type="text" 
              id="smarthire-req-filter" 
              placeholder="Filter 180+ jobs (.NET, BA, Java, #159287)..." 
              class="smarthire-input" 
              style="margin-bottom:6px; font-size:11.5px; padding:6px 9px;"
            />

            <!-- Synchronously rendered Select dropdown -->
            <select id="smarthire-req-select" class="smarthire-select">
              ${filteredJobs.map(j => `<option value="${j.id || j.reqId}">#${j.id || j.reqId} · ${j.title} (${j.location || 'Remote'})</option>`).join('')}
            </select>

            <div id="smarthire-req-info" style="margin-top:8px; font-size:11px; color:#475569; background:#F8FAFC; border:1px solid #E2E8F0; padding:8px 10px; border-radius:6px;"></div>

            <button id="smarthire-btn-autosearch" class="smarthire-btn-secondary" style="margin-top:8px;">
              🔍 Auto-Fill Search on Current Page
            </button>
          </div>

          <!-- Quick Extraction Action Card -->
          <div class="smarthire-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <label class="smarthire-label" style="margin-bottom:0;">Candidate Extraction</label>
              <span style="font-size:10px; color:#059669; font-weight:700;">Deep Click Scraper</span>
            </div>
            
            <button id="smarthire-btn-scrape" class="smarthire-btn-primary">
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

          <button id="smarthire-btn-copy-tsv" class="smarthire-btn-secondary" style="margin-bottom:6px;">
            📋 Copy to Clipboard (Excel TSV Format)
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
    document.getElementById('smarthire-btn-autosearch').addEventListener('click', () => {
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
    document.getElementById('smarthire-btn-scrape').addEventListener('click', () => {
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

    const skills = Array.isArray(selectedJob.skills) 
      ? selectedJob.skills.slice(0, 5).join(', ') 
      : (selectedJob.skills || 'Core Skills');

    info.innerHTML = `
      <div style="font-weight:700; color:#0F172A; margin-bottom:3px;">#${selectedJob.id} · ${selectedJob.title}</div>
      <div style="color:#64748B;"><strong>Location:</strong> ${selectedJob.location || 'Remote'} | <strong>Rate:</strong> ${selectedJob.rate || 'Open'}</div>
      <div style="color:#2563EB; margin-top:2px;"><strong>Key Skills:</strong> ${skills}</div>
    `;
  }

  function generateBooleanQuery(job) {
    const title = (job.title || '').replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
    const skills = Array.isArray(job.skills) ? job.skills.slice(0, 3) : (job.skills ? String(job.skills).split(',').slice(0, 3) : []);
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
        const clickCandidates = [];
        if (clickSelector) {
          const userEl = container.querySelector(clickSelector);
          if (userEl) clickCandidates.push(userEl);
        }
        const bodyEl = container.querySelector('.smui-card-body');
        if (bodyEl && !clickCandidates.includes(bodyEl)) clickCandidates.push(bodyEl);
        const nameLink = container.querySelector('a[href*="/candidates/"], a[href*="/candidate/"], h2 a, h3 a, a');
        if (nameLink && !clickCandidates.includes(nameLink)) clickCandidates.push(nameLink);
        if (!clickCandidates.includes(container)) clickCandidates.push(container);

        const primaryTarget = clickCandidates[0] || container;
        const rect = primaryTarget.getBoundingClientRect();
        const clientX = rect.left + rect.width / 2;
        const clientY = rect.top + rect.height / 2;
        const evtInit = { bubbles: true, cancelable: true, view: window, clientX, clientY, buttons: 1 };

        primaryTarget.dispatchEvent(new PointerEvent('pointerdown', evtInit));
        primaryTarget.dispatchEvent(new MouseEvent('mousedown', evtInit));
        primaryTarget.dispatchEvent(new PointerEvent('pointerup', evtInit));
        primaryTarget.dispatchEvent(new MouseEvent('mouseup', evtInit));
        primaryTarget.click();

        // Wait for Monster's right pane to load
        await sleep(delayMs || 800);

        // Action 2: Switch to Profile tab if present
        const profileTab = document.querySelector('li:nth-of-type(2) > .tab__title > .tab__label') ||
                           Array.from(document.querySelectorAll('.tab__label, button, [role="tab"]')).find(t => 
                             t.innerText && t.innerText.trim().toLowerCase() === 'profile'
                           );
        if (profileTab && !profileTab.closest('.tab--active')) {
          profileTab.click();
          await sleep(300);
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
          const detailNameEl = document.querySelector('.candidate-name > div > span, .candidate-name, [data-testid*="candidate-name"]');
          if (detailNameEl && detailNameEl.innerText.trim()) {
            name = window.extractCleanMonsterName(detailNameEl.innerText);
          }
        }
        name = name.replace(/sms\s*opt-in/gi, '').replace(/viewed/gi, '').replace(/·/g, '').trim();
        if (!name || name.toLowerCase().includes('need help')) {
          name = `Candidate ${i + 1}`;
        }

        if (seenNames.has(name.toLowerCase())) {
          container.style.outline = oldOutline;
          continue;
        }

        // Action 4: Extract Email & Phone from #contact-legend-detail or detail pane
        let email = '';
        let phone = '';

        const contactBox = document.querySelector('#contact-legend-detail, [id*="contact-legend"], [class*="contact-legend"]') ||
                           (emailSelector ? document.querySelector(emailSelector) : null);
        if (contactBox) {
          const bTxt = contactBox.innerText || '';
          const mailLink = contactBox.querySelector ? contactBox.querySelector('a[href^="mailto:"]') : null;
          if (mailLink) email = mailLink.href.replace('mailto:', '').split('?')[0].trim().toLowerCase();
          if (!email) {
            const m = bTxt.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            if (m && !m[1].startsWith('support@') && !m[1].startsWith('info@')) email = m[1].trim().toLowerCase();
          }

          const telLink = contactBox.querySelector ? contactBox.querySelector('a[href^="tel:"]') : null;
          if (telLink) phone = telLink.href.replace('tel:', '').trim();
          if (!phone) {
            const m = bTxt.match(/(?:Phone|Mobile|Cell|Direct)?\s*[:\s]?\s*(\+?1?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4})/i) ||
                      bTxt.match(/(\+?1\d{10})/);
            if (m) phone = m[1].trim();
          }
        }

        // Fallback to resume text or right detail pane
        if (!email || !phone) {
          const detailPanes = document.querySelectorAll('[class*="resume"], [class*="detail"], [class*="profile"], aside');
          for (const pane of detailPanes) {
            if (pane.closest('#smarthire-copilot-drawer')) continue;
            const pTxt = pane.innerText || '';
            if (pTxt.includes('@') || pTxt.includes('Phone:')) {
              if (!email) {
                const m = pTxt.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                if (m && !m[1].startsWith('support@') && !m[1].startsWith('info@')) email = m[1].trim().toLowerCase();
              }
              if (!phone) {
                const m = pTxt.match(/(?:Phone|Mobile|Cell|Direct)?\s*[:\s]?\s*(\+?1?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4})/i) ||
                          pTxt.match(/(\+?1\d{10})/);
                if (m) phone = m[1].trim();
              }
              if (email && phone) break;
            }
          }
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

        let location = 'United States';
        const locMatch = (container.innerText || '').match(/\b([A-Z][a-zA-Z\s.-]+),\s*([A-Z]{2}|[A-Za-z\s]+)\b/);
        if (locMatch && !locMatch[0].includes('Select a Card') && !locMatch[0].includes('Open In')) {
          location = locMatch[0].trim();
        }

        seenNames.add(name.toLowerCase());
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
        list = window.smartHireScrapeCandidates();
      }

      scrapedCandidates = list;
      status.innerText = `✓ Extracted ${list.length} candidate(s) successfully!`;
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

      previewList.innerHTML = list.map((c, i) => {
        const hasPhone = c.phone && c.phone.length >= 7 && !c.phone.includes('555-0199') && c.phone !== 'Not Disclosed';
        const hasEmail = c.email && c.email.includes('@') && !c.email.includes('@monster.talent') && c.email !== 'Not Disclosed';
        const isVerified = hasPhone || hasEmail;

        return `
          <div style="padding:8px 10px; border-bottom:1px solid #F1F5F9; font-size:11px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight:700; color:#0F172A;">${i + 1}. ${c.name}</span>
              ${isVerified 
                ? '<span style="background:#DCFCE7; color:#15803D; font-size:9px; font-weight:700; padding:1px 5px; border-radius:3px;">VERIFIED CONTACT</span>' 
                : '<span style="background:#F1F5F9; color:#64748B; font-size:9px; font-weight:600; padding:1px 5px; border-radius:3px;">PROFILE ONLY</span>'}
            </div>
            <div style="color:#475569; font-size:10.5px; margin-top:2px;">${c.title} · ${c.location}</div>
            <div style="margin-top:3px; font-size:10.5px; display:flex; flex-direction:column; gap:2px;">
              <div style="color:#2563EB;"><strong>Email:</strong> ${c.email}</div>
              <div style="color:#0F172A; font-family:monospace;"><strong>Phone:</strong> ${c.phone}</div>
            </div>
          </div>
        `;
      }).join('');
    } else {
      resultsCard.style.display = 'none';
    }
  }

  function copyCandidatesToClipboard() {
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
    navigator.clipboard.writeText(tsv).then(() => {
      const msg = document.getElementById('smarthire-import-msg');
      msg.style.color = '#059669';
      msg.innerText = '✓ Copied TSV to clipboard! Press Ctrl+V in Excel or Google Sheets.';
      setTimeout(() => { msg.innerText = ''; }, 4000);
    });
  }

  function importToSmartHireAts() {
    const msg = document.getElementById('smarthire-import-msg');
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
          recruiterEmail: 'omkesh@coolsofttech.com',
          recruiterName: 'Omkesh Manjute'
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
