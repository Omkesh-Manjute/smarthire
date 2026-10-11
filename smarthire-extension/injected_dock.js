// SmartHire Sourcing Copilot v3.5 - Injected In-Page Sidebar Dock
(function() {
  // Always clean up any existing trigger or drawer to allow seamless hot updates
  const existingTrigger = document.getElementById('smarthire-copilot-trigger');
  if (existingTrigger) existingTrigger.remove();
  const existingDrawer = document.getElementById('smarthire-copilot-drawer');
  if (existingDrawer) existingDrawer.remove();

  let scrapedCandidates = [];
  let allJobs = (window.SMARTHIRE_BUNDLED_JOBS && Array.isArray(window.SMARTHIRE_BUNDLED_JOBS)) 
    ? window.SMARTHIRE_BUNDLED_JOBS 
    : [];
  let filteredJobs = [...allJobs];
  let selectedJob = allJobs.length > 0 ? allJobs[0] : null;

  function initDock() {
    // 1. Sleek, Compact Trigger Button (38px icon button - NO long text strip)
    const trigger = document.createElement('div');
    trigger.id = 'smarthire-copilot-trigger';
    trigger.title = 'SmartHire ATS Sourcing Copilot v3.5 (Click to Open)';
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
          <span style="background:#1E293B; color:#93C5FD; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; border:1px solid #334155;">v3.5 Live</span>
        </div>
        <button id="smarthire-drawer-close" style="background:none; border:none; color:#94A3B8; font-size:22px; cursor:pointer; line-height:1; padding:0 4px;">&times;</button>
      </div>

      <div class="smarthire-drawer-body">
        <!-- Requisition Selector Card -->
        <div class="smarthire-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label class="smarthire-label" style="margin-bottom:0;">ATS Target Requisition</label>
            <span id="smarthire-job-count-badge" style="font-size:10px; color:#2563EB; font-weight:700;">${allJobs.length} Jobs</span>
          </div>

          <!-- Instant Filter for 180+ Requisitions -->
          <input 
            type="text" 
            id="smarthire-req-filter" 
            placeholder="Type to filter 180+ jobs (.NET, BA, Java, #159287)..." 
            class="smarthire-input" 
            style="margin-bottom:6px; font-size:11.5px; padding:6px 9px;"
          />

          <select id="smarthire-req-select" class="smarthire-select">
            <option value="">Loading requisitions...</option>
          </select>

          <div id="smarthire-req-info" style="margin-top:8px; font-size:11px; color:#475569; display:none; background:#F8FAFC; border:1px solid #E2E8F0; padding:8px 10px; border-radius:6px;"></div>

          <button id="smarthire-btn-autosearch" class="smarthire-btn-secondary" style="display:none; margin-top:8px;">
            🔍 Auto-Fill Search on Current Page
          </button>
        </div>

        <!-- Extraction Action Card -->
        <div class="smarthire-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label class="smarthire-label" style="margin-bottom:0;">Deep Candidate Extraction</label>
            <span style="font-size:10px; color:#059669; font-weight:700;">Browserflow Engine</span>
          </div>
          
          <button id="smarthire-btn-scrape" class="smarthire-btn-primary">
            ⚡ 1-Click Scrape Candidates
          </button>
          
          <div id="smarthire-scrape-status" style="margin-top:8px; font-size:11px; color:#64748B; text-align:center; font-weight:500; min-height:18px;">
            Auto-clicks cards to extract verified phone numbers & emails from detail pane
          </div>
        </div>

        <!-- Results Card -->
        <div id="smarthire-results-card" class="smarthire-card" style="display:none;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <label class="smarthire-label" style="margin-bottom:0;">
              Scraped Candidates (<span id="smarthire-count">0</span>)
            </label>
            <span id="smarthire-portal-tag" style="background:#EFF6FF; color:#1D4ED8; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; text-transform:uppercase;">MONSTER+</span>
          </div>

          <div id="smarthire-candidate-preview-list" style="max-height:240px; overflow-y:auto; border:1px solid #E2E8F0; border-radius:6px; background:#FFFFFF; margin-bottom:10px;">
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

    // Initial render of all 180 jobs
    renderJobsList();

    // Try fetching latest jobs dynamically via background
    fetchDynamicJobs();

    // Event Listeners
    trigger.addEventListener('click', () => {
      drawer.classList.add('open');
    });

    document.getElementById('smarthire-drawer-close').addEventListener('click', () => {
      drawer.classList.remove('open');
    });

    // Instant filter for requisitions
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
      renderJobsList(true);
    });

    // Dropdown change
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

    // 1-Click Scrape Candidates
    document.getElementById('smarthire-btn-scrape').addEventListener('click', () => {
      runInPageScrape();
    });

    // Copy TSV to Clipboard
    document.getElementById('smarthire-btn-copy-tsv').addEventListener('click', () => {
      copyCandidatesToClipboard();
    });

    // 1-Click Import to ATS
    document.getElementById('smarthire-btn-import-ats').addEventListener('click', () => {
      importToSmartHireAts();
    });
  }

  function renderJobsList(preserveSelection = false) {
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
    const autoBtn = document.getElementById('smarthire-btn-autosearch');
    if (!selectedJob) {
      if (info) info.style.display = 'none';
      if (autoBtn) autoBtn.style.display = 'none';
      return;
    }

    const skills = Array.isArray(selectedJob.skills) 
      ? selectedJob.skills.slice(0, 5).join(', ') 
      : (selectedJob.skills || 'Core Skills');

    if (info) {
      info.style.display = 'block';
      info.innerHTML = `
        <div style="font-weight:700; color:#0F172A; margin-bottom:3px;">#${selectedJob.id} · ${selectedJob.title}</div>
        <div style="color:#64748B;"><strong>Location:</strong> ${selectedJob.location || 'Remote'} | <strong>Rate:</strong> ${selectedJob.rate || 'Open'}</div>
        <div style="color:#2563EB; margin-top:2px;"><strong>Key Skills:</strong> ${skills}</div>
      `;
    }
    if (autoBtn) autoBtn.style.display = 'flex';
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

  function fetchDynamicJobs() {
    try {
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'FETCH_JOBS' }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('[SmartHire Copilot] Using bundled 180 jobs.');
            return;
          }
          if (response && response.success && Array.isArray(response.jobs) && response.jobs.length > 0) {
            allJobs = response.jobs;
            filteredJobs = [...allJobs];
            renderJobsList(true);
          }
        });
      }
    } catch (e) {
      console.log('[SmartHire Copilot] Background messaging caught:', e);
    }
  }

  async function runInPageScrape() {
    const status = document.getElementById('smarthire-scrape-status');
    const scrapeBtn = document.getElementById('smarthire-btn-scrape');
    scrapeBtn.disabled = true;
    scrapeBtn.style.opacity = '0.7';
    status.innerText = 'Initializing deep candidate extraction...';

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

      const resultsCard = document.getElementById('smarthire-results-card');
      const countEl = document.getElementById('smarthire-count');
      const previewList = document.getElementById('smarthire-candidate-preview-list');

      if (list.length > 0) {
        resultsCard.style.display = 'block';
        countEl.innerText = list.length;

        previewList.innerHTML = list.map((c, i) => {
          const hasPhone = c.phone && c.phone.length >= 7 && !c.phone.includes('555-0199');
          const hasEmail = c.email && c.email.includes('@') && !c.email.includes('@monster.talent');
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
                <div style="color:#2563EB;"><strong>Email:</strong> ${c.email || 'Not Disclosed'}</div>
                <div style="color:#0F172A; font-family:monospace;"><strong>Phone:</strong> ${c.phone || 'Not Disclosed'}</div>
              </div>
            </div>
          `;
        }).join('');
      } else {
        resultsCard.style.display = 'none';
        status.innerText = 'No candidates detected. Make sure candidate cards are visible on the page.';
      }
    } catch (err) {
      console.error('[SmartHire Copilot] Scrape error:', err);
      status.innerText = `Error: ${err.message}`;
    } finally {
      scrapeBtn.disabled = false;
      scrapeBtn.style.opacity = '1';
    }
  }

  function copyCandidatesToClipboard() {
    if (!scrapedCandidates || scrapedCandidates.length === 0) return;
    const header = ['Sl. No', 'Candidate Name', 'Job Title', 'Email', 'Phone', 'Location', 'Experience', 'Skills', 'Source', 'Profile Link'];
    const rows = scrapedCandidates.map((c, i) => [
      i + 1,
      c.name,
      c.title,
      c.email || '',
      c.phone || '',
      c.location || '',
      c.experience || '',
      (c.skills || []).join(', '),
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
          source: window.smartHirePortal || 'Monster+ Extension',
          recruiterEmail: 'omkesh@coolsofttech.com',
          recruiterName: 'Omkesh Manjute'
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          msg.style.color = '#DC2626';
          msg.innerText = 'Extension reloaded. Please refresh this tab (Cmd+R) and retry import.';
          return;
        }
        if (response && response.success && response.data) {
          msg.style.color = '#059669';
          msg.innerText = `✓ ${response.data.message || 'Successfully imported candidates into ATS!'}`;
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

  // Auto-mount
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDock);
  } else {
    initDock();
  }
})();
