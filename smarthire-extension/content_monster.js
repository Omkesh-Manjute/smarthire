// SmartHire Sourcing Copilot v3.9 - Monster+ Content Script
(function() {
  window.smartHirePortal = 'Monster+';
  console.log('[SmartHire Copilot v3.9] Monster+ content script loaded on:', window.location.href);

  const utils = window.SmartHireUtils || {
    extractEmails: (text) => {
      if (!text) return [];
      const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      // Keep candidate relay emails like siva.n.c1ex1@contact.monster.com! Only ignore corporate monster support/sales
      const filtered = match.filter(e => {
        const lower = e.toLowerCase();
        return !lower.startsWith('support@') && !lower.startsWith('info@') && !lower.startsWith('donotreply@') && !lower.startsWith('privacy@');
      });
      return Array.from(new Set(filtered.map(e => e.toLowerCase())));
    },
    extractPhones: (text) => {
      if (!text) return [];
      const match = text.match(/(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || [];
      return Array.from(new Set(match));
    },
    extractExperience: (text) => {
      if (!text) return '';
      const m = text.match(/(\d+\+?\s*(?:years?|yrs?)(?:\s*(?:of)?\s*experience)?)/i);
      return m ? m[1] : '';
    },
    setNativeValue: (el, val) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (setter) setter.call(el, val);
      else el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Extract clean City, State location from Monster candidate card or resume text
  window.extractCleanMonsterLocation = function(text) {
    if (!text) return '';
    if (window.SmartHireUtils && typeof window.SmartHireUtils.extractLocation === 'function') {
      const loc = window.SmartHireUtils.extractLocation(text);
      if (loc) return loc;
    }

    const US_STATES = [
      'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware',
      'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky',
      'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri',
      'montana', 'nebraska', 'nevada', 'new hampshire', 'new jersey', 'new mexico', 'new york',
      'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode island',
      'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington',
      'west virginia', 'wisconsin', 'wyoming', 'district of columbia', 'puerto rico'
    ];
    const US_STATE_CODES = [
      'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia', 'ks',
      'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj', 'nm', 'ny',
      'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv',
      'wi', 'wy', 'dc', 'pr'
    ];

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.length < 4 || line.length > 50) continue;
      if (/select a card|open in|updated:|current:|previous:|top skills:|viewed|candidate|opt-in|experience|history|education|degree|major|school|skill|search/i.test(line)) continue;
      
      const m = line.match(/^([A-Za-z\s.-]{2,35}),\s*([A-Za-z\s]{2,25}?)(?:\s+\d{5}(?:-\d{4})?)?$/);
      if (m) {
        const city = m[1].trim();
        const stateRaw = m[2].trim();
        const stateLower = stateRaw.toLowerCase();
        if (US_STATES.includes(stateLower) || US_STATE_CODES.includes(stateLower)) {
          return `${city}, ${stateRaw}`;
        }
      }
    }

    for (const line of lines) {
      if (line.length < 4 || line.length > 60) continue;
      if (/select a card|open in|updated:|current:|previous:|top skills:|viewed/i.test(line)) continue;
      const m = line.match(/\b([A-Z][a-zA-Z\s.-]{1,30}),\s*([A-Z]{2})\b/);
      if (m) {
        const stateCode = m[2].toLowerCase();
        if (US_STATE_CODES.includes(stateCode)) {
          return `${m[1].trim()}, ${m[2].trim()}`;
        }
      }
    }
    return '';
  };

  // Extract verified personal email from resume text or container
  window.extractCandidateEmailFromText = function(text) {
    if (!text || text.length < 10) return '';
    const headerSlice = text.slice(0, 3000);
    let fEmails = (window.SmartHireUtils?.extractEmails || utils.extractEmails)(headerSlice);
    if (!fEmails || fEmails.length === 0) {
      fEmails = (window.SmartHireUtils?.extractEmails || utils.extractEmails)(text);
    }
    if (!fEmails || fEmails.length === 0) return '';

    const cleanEmails = fEmails.filter(e => {
      const l = e.toLowerCase();
      if (l.startsWith('support@') || l.startsWith('info@') || l.startsWith('sales@') ||
          l.startsWith('careers@') || l.startsWith('jobs@') || l.startsWith('privacy@') ||
          l.startsWith('help@') || l.startsWith('donotreply@') || l.startsWith('noreply@') ||
          l.startsWith('service@') || (l.startsWith('contact@') && !l.endsWith('@contact.monster.com')) ||
          l.includes('coolsofttech')) {
        return false;
      }
      if (l.includes('monster.com') && !l.endsWith('@contact.monster.com')) {
        return false;
      }
      return true;
    });

    if (cleanEmails.length === 0) return '';

    // Prefer consumer domains or candidate relay emails
    const preferred = cleanEmails.find(e => {
      const l = e.toLowerCase();
      return l.endsWith('@gmail.com') || l.endsWith('@yahoo.com') || l.endsWith('@hotmail.com') ||
             l.endsWith('@outlook.com') || l.endsWith('@icloud.com') || l.endsWith('@aol.com') ||
             l.endsWith('@contact.monster.com');
    });

    return preferred || cleanEmails[0];
  };

  // Extract candidate phone strictly from text
  window.extractCandidatePhoneFromText = function(text) {
    if (!text || text.length < 10) return '';
    const headerSlice = text.slice(0, 3000);
    let fPhones = (window.SmartHireUtils?.extractPhones || utils.extractPhones)(headerSlice);
    if (!fPhones || fPhones.length === 0) {
      fPhones = (window.SmartHireUtils?.extractPhones || utils.extractPhones)(text);
    }
    return (fPhones && fPhones.length > 0) ? fPhones[0] : '';
  };

  // Clean candidate name (strip Monster accessible screen-reader noise)
  window.extractCleanMonsterName = function(raw) {
    if (!raw) return '';
    let str = raw
      .replace(/Select\s+a\s+Card\s+Number-\d+,?\s*/gi, '')
      .replace(/Open\s*In\s*New\s*Tab/gi, '')
      .replace(/Favorite/gi, '')
      .replace(/Veteran\s*Diversity/gi, '')
      .replace(/Viewed\s*(?:by:)?/gi, '')
      .replace(/SMS\s*Opt-in/gi, '')
      .replace(/Updated\s*[:\s]*[^\n\r·]+/gi, '')
      .replace(/Current:\s*[^\n\r]+/gi, '')
      .replace(/Previous:\s*[^\n\r]+/gi, '')
      .replace(/Top\s*Skills:\s*[^\n\r]+/gi, '')
      .trim();

    const lines = str.split('\n').map(l => l.trim()).filter(Boolean);
    const candidateLine = lines[0] || '';
    return candidateLine
      .replace(/open\s*in\s*new\s*tab/gi, '')
      .replace(/sms\s*opt-in/gi, '')
      .replace(/viewed\s*(?:by:)?/gi, '')
      .replace(/·/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Resume-only Text Sanitizer: Exclude Monster action buttons, navigation labels, and UI fragments
  window.cleanMonsterResumeText = function(rawText) {
    if (!rawText) return '';
    let text = String(rawText);

    // 1. Remove accessibility & search card boilerplates
    text = text
      .replace(/Select\s+a\s+Card\s+Number-\d+,?\s*/gi, '')
      .replace(/Open\s*In\s*New\s*Tab/gi, '')
      .replace(/Favorite/gi, '')
      .replace(/Veteran\s*Diversity/gi, '')
      .replace(/SMS\s*Opt-in/gi, '')
      .replace(/Viewed\s*(?:by:?[^\n\r]*)?/gi, '')
      .replace(/Candidate\s+\d+\s+of\s+\d+/gi, '')
      .replace(/Select\s+all\s+candidates/gi, '')
      .replace(/Matched\s+to\s+job\s*[:\s]*[^\n\r]+/gi, '')
      .replace(/Updated\s*[:\s]*[^\n\r·]+/gi, '')
      .replace(/Top\s*Skills\s*[:\s]*[^\n\r·]+/gi, '');

    // 2. Remove Monster drawer actions, search filter accordions & navigation buttons
    text = text
      .replace(/(?:expand|collapse)\s+search\s+filter[^\n\r]*/gi, '')
      .replace(/search\s+filter[^\n\r]*/gi, '')
      .replace(/filter\s+by[^\n\r]*/gi, '')
      .replace(/degree\/major[^\n\r]*/gi, '')
      .replace(/years\s+of\s+experience\s+filter[^\n\r]*/gi, '')
      .replace(/\b(?:Back\s+to\s+(?:search\s+results|candidates?|search))\b/gi, '')
      .replace(/\b(?:Contact\s+candidate|Send\s+message|Send\s+email)\b/gi, '')
      .replace(/\b(?:Add\s+to\s+(?:Pipeline|Candidate\s+Pool|Job|Folder))\b/gi, '')
      .replace(/\b(?:Export\s+to\s+ATS|Download\s+resume|View\s+profile|Save\s+candidate)\b/gi, '')
      .replace(/\b(?:Next\s+candidate|Previous\s+candidate)\b/gi, '')
      .replace(/\b(?:Actions|Print|Share|Report\s+profile)\b/gi, '')
      .replace(/\b(?:Overview\s+Profile\s+Resume\s+Activity\s+Notes)\b/gi, '')
      .replace(/\b(?:Need\s+Help\?|Post\s+a\s+Job|Create\s+Campaign)\b/gi, '');

    // 3. Normalize whitespace & remove isolated noise lines
    const rawLines = text.split(/\r?\n/).map(line => line.replace(/[ \t]+/g, ' ').trim()).filter(Boolean);
    const cleanLines = [];
    const seenRecentLines = new Set();

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const lower = line.toLowerCase();
      if (lower.length < 2) continue;
      // Strip action button words & search filter lines
      if (/^(?:expand|collapse)\s+search\s+filter/i.test(lower)) continue;
      if (/search\s+filter/i.test(lower)) continue;
      if (/filter\s+by/i.test(lower)) continue;
      if (/degree\/major/i.test(lower)) continue;
      if (/^(?:back|contact|send|add|export|view|save|actions|next|previous|print|share|download|close|cancel|submit|edit|delete|more|filter|sort|search|login|sign in|sign out)$/i.test(lower)) continue;
      if (/^(?:overview|profile|resume|activity|notes|candidate details|matches \(\d+\)|favorites \(\d+\)|skipped \(\d+\))$/i.test(lower)) continue;
      if (/^select a card/i.test(lower)) continue;
      if (/^viewed\b/i.test(lower)) continue;
      if (/^clear all|^undo|^update$/i.test(lower)) continue;

      // Avoid consecutive duplicate lines
      if (cleanLines.length > 0 && cleanLines[cleanLines.length - 1] === line) continue;

      cleanLines.push(line);
    }

    return cleanLines.join('\n');
  };

  // Find Monster Resume Tab
  window.findMonsterResumeTab = function(container = document) {
    const roots = [container, document].filter(Boolean);

    // 1. Direct targeted selectors for Monster+ SMUI tabs (both 2-tab and 3-tab layouts)
    const directSelectors = [
      'li:nth-of-type(2) > .tab__title > .tab__label',
      'li:nth-of-type(3) > .tab__title > .tab__label',
      'li:nth-of-type(2) .tab__label',
      'li:nth-of-type(3) .tab__label',
      'li:nth-of-type(2) [role="tab"]',
      'li:nth-of-type(3) [role="tab"]',
      'li:nth-of-type(2)',
      'li:nth-of-type(3)',
      '[data-testid*="resume-tab"]',
      '[data-testid*="tab-resume"]',
      '[id*="tab-resume"]',
      '[aria-controls*="resume"]',
      '[aria-label*="resume" i]',
      '[aria-label*="cv" i]'
    ];

    for (const root of roots) {
      for (const sel of directSelectors) {
        try {
          const els = root.querySelectorAll(sel);
          for (const el of els) {
            if (el && !el.closest('#smarthire-copilot-drawer') && !el.closest('#smarthire-dossier-overlay')) {
              const t = (el.innerText || el.textContent || '').trim().toLowerCase();
              if (t.includes('resume') || t.includes('cv') || sel.includes('resume')) {
                return el;
              }
            }
          }
        } catch (e) {}
      }
    }

    // 2. Generic tab selectors with flexible label matching
    const tabSelectors = [
      '[role="tab"]',
      'button[role="tab"]',
      'a[role="tab"]',
      'li[class*="tab"]',
      '.tab__label',
      '.tab__title',
      '[data-testid*="tab"]',
      'button',
      'a',
      'li',
      'span'
    ];

    for (const root of roots) {
      for (const sel of tabSelectors) {
        let els;
        try { els = Array.from(root.querySelectorAll(sel)); } catch (e) { continue; }
        for (const el of els) {
          if (el.closest('#smarthire-copilot-drawer') || el.closest('#smarthire-copilot-trigger') || el.closest('#smarthire-dossier-overlay')) continue;
          const t = (el.innerText || el.textContent || '').trim().toLowerCase();
          if (t.length > 0 && t.length <= 40) {
            if (/^resume\b/i.test(t) || /\bresume\b/i.test(t) || t === 'cv' || t.includes('resume &') || t.includes('view resume')) {
              return el;
            }
          }
        }
      }
    }
    return null;
  };

  // Find Monster Profile Tab
  window.findMonsterProfileTab = function(container = document) {
    const roots = [container, document].filter(Boolean);
    const tabSelectors = [
      '[role="tab"]',
      'button[role="tab"]',
      'a[role="tab"]',
      'li > .tab__title > .tab__label',
      '[data-testid*="tab"]',
      '[data-testid*="profile"]',
      '[class*="tab"]',
      'button',
      'a',
      'li',
      'span',
      'div'
    ];

    for (const root of roots) {
      for (const sel of tabSelectors) {
        let els;
        try { els = Array.from(root.querySelectorAll(sel)); } catch (e) { continue; }
        for (const el of els) {
          if (el.closest('#smarthire-copilot-drawer') || el.closest('#smarthire-copilot-trigger') || el.closest('#smarthire-dossier-overlay')) continue;
          const t = (el.innerText || el.textContent || '').trim().toLowerCase();
          if (t.length > 0 && t.length <= 40) {
            if (t === 'profile' || t === 'candidate profile' || t === 'profile details' || t.startsWith('profile')) {
              return el;
            }
          }
        }
      }
    }
    return null;
  };

  // Activate Monster Resume Tab safely without navigating or reloading
  window.activateMonsterResumeTab = function(resumeTab) {
    if (!resumeTab) return false;
    try {
      // Pick the single best tab target (prefer role="tab", button, or li over raw anchor)
      const target = resumeTab.closest('[role="tab"]') ||
                     resumeTab.closest('button') ||
                     resumeTab.closest('li') ||
                     resumeTab;

      target.scrollIntoView({ behavior: 'auto', block: 'nearest' });
      target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
      target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));

      const clickEvt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
      target.dispatchEvent(clickEvt);

      // Only invoke native .click() if target is NOT an anchor with an external href (to prevent browser navigation/page reload)
      const anchor = target.tagName === 'A' ? target : target.closest('a');
      const href = anchor ? anchor.getAttribute('href') : null;
      if (!anchor || !href || href === '#' || href.startsWith('javascript:')) {
        if (typeof target.click === 'function') {
          try { target.click(); } catch (e) {}
        }
      }
      return true;
    } catch (e) {
      console.warn('[SmartHire Copilot] Error activating Resume tab:', e);
      return false;
    }
  };

  // Find Monster Candidate Card by candidate name
  window.findMonsterCardByName = function(name = '') {
    if (!name) return null;
    const nameClean = name.toLowerCase().trim();
    const firstName = nameClean.split(/\s+/)[0];
    
    const cardSelectors = [
      'smui-card',
      '[data-testid*="candidate-card"]',
      '[class*="candidate-card"]',
      '[class*="CandidateCard"]',
      '[class*="search-result"]',
      '[class*="searchResult"]'
    ];
    
    for (const sel of cardSelectors) {
      const cards = Array.from(document.querySelectorAll(sel)).filter(c => {
        return !c.closest('#smarthire-copilot-drawer') && !c.closest('#smarthire-dossier-overlay');
      });
      for (const card of cards) {
        const text = (card.innerText || '').toLowerCase();
        if (text.includes(nameClean) || (firstName.length >= 3 && text.includes(firstName))) {
          return card;
        }
      }
    }
    return null;
  };

  // Check whether the currently displayed right-hand split-view column matches target candidate
  window.isMonsterCandidateActive = function(candidateName = '') {
    if (!candidateName) return true;
    const isExcluded = (el) => {
      if (!el) return true;
      if (el.closest('#smarthire-copilot-drawer') || el.closest('#smarthire-copilot-trigger') || el.closest('#smarthire-dossier-overlay')) return true;
      if (el.tagName.toLowerCase() === 'smui-card' || el.closest('smui-card')) return true;
      return false;
    };

    const clean = candidateName.trim().toLowerCase();
    const parts = clean.split(/\s+/).filter(p => p.length >= 2);
    const firstName = parts[0] || '';
    const lastName = parts.slice(-1)[0] || '';

    // Check headings, titles, and text elements in the right split-view column (>= 20% window width)
    const rightElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, p, span, div, header, [class*="header"], [class*="title"], [class*="name"]')).filter(el => {
      if (isExcluded(el)) return false;
      const rect = el.getBoundingClientRect();
      return rect.left >= window.innerWidth * 0.20 && rect.width >= 30;
    });

    for (const el of rightElements) {
      const txt = (el.innerText || el.textContent || '').trim().toLowerCase();
      if (!txt) continue;
      if (txt.includes(clean)) return true;
      if (firstName.length >= 3 && lastName.length >= 3 && txt.includes(firstName) && txt.includes(lastName)) return true;
      if (firstName.length >= 3 && txt.includes(firstName)) return true;
      if (lastName.length >= 3 && txt.includes(lastName)) return true;
    }

    return true; // Graceful default if ambiguous
  };

  // Select / click candidate card safely without navigating away or reloading
  window.selectMonsterCandidateCard = function(card) {
    if (!card) return false;
    try {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Attach one-shot event capturer to prevent any anchor from navigating away
      const preventAnchorNavigation = (e) => {
        const anchor = e.target && (e.target.tagName === 'A' ? e.target : e.target.closest('a'));
        if (anchor) {
          const href = anchor.getAttribute('href') || '';
          if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
            e.preventDefault();
          }
        }
      };
      window.addEventListener('click', preventAnchorNavigation, { capture: true, once: true });

      // Elements that should never be clicked (action buttons, favorites, checkboxes)
      const isUnsafeElement = (el) => {
        if (!el) return true;
        if (el.type === 'checkbox' || el.closest('[role="checkbox"]') || el.closest('[class*="checkbox"]')) return true;
        if (el.closest('[data-testid*="favorite"]') || el.closest('[class*="favorite"]')) return true;
        if (el.closest('[aria-label*="favorite"]') || el.closest('[aria-label*="Favorite"]')) return true;
        if (el.closest('[aria-label*="Actions"]') || el.closest('[aria-label*="more options"]')) return true;
        return false;
      };

      // Best targets on card: candidate title, card body, card header, or card root
      const targets = [
        card.querySelector('[class*="candidate-details"]'),
        card.querySelector('[class*="candidate-summary"]'),
        card.querySelector('.smui-card-body'),
        card.querySelector('[class*="card-body"]'),
        card.querySelector('.smui-card-header'),
        card.querySelector('[class*="card-header"]'),
        card.querySelector('[data-testid*="card-content"]'),
        card.querySelector('[class*="card-content"]'),
        card.querySelector('h2, h3, h4, [class*="title"], [class*="role"], [class*="job"]'),
        card
      ].filter(el => el && !isUnsafeElement(el));

      const clickTarget = targets[0] || card;

      const opts = { bubbles: true, cancelable: true, view: window };
      clickTarget.dispatchEvent(new MouseEvent('pointerdown', opts));
      clickTarget.dispatchEvent(new MouseEvent('mousedown', opts));
      clickTarget.dispatchEvent(new MouseEvent('pointerup', opts));
      clickTarget.dispatchEvent(new MouseEvent('mouseup', opts));
      clickTarget.dispatchEvent(new MouseEvent('click', opts));

      if (clickTarget.tagName !== 'A' && !clickTarget.closest('a') && typeof clickTarget.click === 'function') {
        try { clickTarget.click(); } catch (e) {}
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  // Locate the Monster Detail / Resume Preview Pane (handles split-view column, drawer, or dialog)
  window.findMonsterDetailPane = function(candidateName = '') {
    const isExcluded = (el) => {
      if (!el) return true;
      if (el.closest('#smarthire-copilot-drawer') || el.closest('#smarthire-copilot-trigger') || el.closest('#smarthire-dossier-overlay')) return true;
      if (el.tagName === 'NAV' || el.tagName === 'HEADER' || el.tagName === 'FOOTER') return true;
      return false;
    };

    const firstName = candidateName ? candidateName.trim().split(/\s+/)[0].toLowerCase() : '';
    const lastWord = candidateName ? candidateName.trim().split(/\s+/).slice(-1)[0].toLowerCase() : '';
    const nameMatches = (text) => {
      if (!candidateName) return true;
      const lower = (text || '').toLowerCase();
      if (firstName.length >= 3 && lower.includes(firstName)) return true;
      if (lastWord.length >= 3 && lower.includes(lastWord)) return true;
      return false;
    };

    // Strategy 1: Known testid and class selectors for Monster preview pane / drawer
    const paneSelectors = [
      '[data-testid*="candidate-detail"]',
      '[data-testid*="candidate-preview"]',
      '[data-testid*="candidate-view"]',
      '[data-testid*="profile-detail"]',
      '[data-testid*="resume-view"]',
      '[data-testid*="resume-content"]',
      '[data-testid*="resume"]',
      '[data-testid*="document-viewer"]',
      '[class*="candidate-detail"]',
      '[class*="candidateDetail"]',
      '[class*="candidate-preview"]',
      '[class*="candidatePreview"]',
      '[class*="profile-detail"]',
      '[class*="profileDetail"]',
      '[class*="resume-view"]',
      '[class*="resumeView"]',
      '[class*="resume-container"]',
      '[class*="resumeContainer"]',
      '[class*="document-viewer"]',
      '[class*="documentViewer"]',
      '[class*="text-resume"]',
      '[class*="detail-pane"]',
      '[class*="detailPane"]',
      '[class*="right-pane"]',
      '[class*="rightPane"]',
      '[role="dialog"]',
      'aside'
    ];

    for (const sel of paneSelectors) {
      const els = Array.from(document.querySelectorAll(sel)).filter(el => !isExcluded(el));
      for (const el of els) {
        const txt = (el.innerText || el.textContent || '').trim();
        if (txt.length > 200) {
          if (nameMatches(txt) || (!candidateName && (txt.toLowerCase().includes('summary') || txt.toLowerCase().includes('experience')))) {
            return el;
          }
        }
      }
    }

    // Strategy 2: Positional search for right-side preview column (Monster split view)
    const allContainers = Array.from(document.querySelectorAll('div, section, article, main > div > div')).filter(el => {
      if (isExcluded(el)) return false;
      if (el.tagName.toLowerCase() === 'smui-card' || el.closest('smui-card')) return false;
      const rect = el.getBoundingClientRect();
      return rect.width >= 300 && rect.height >= 250 && rect.left >= window.innerWidth * 0.25;
    });

    for (const el of allContainers) {
      const txt = (el.innerText || el.textContent || '').trim();
      const lower = txt.toLowerCase();
      if (txt.length > 250 && (lower.includes('summary') || lower.includes('experience') || lower.includes('education') || lower.includes('skills') || lower.includes('resume'))) {
        if (nameMatches(txt) || !candidateName) {
          return el;
        }
      }
    }

    // Strategy 3: Find element containing candidate's contact relay email
    const relayEmails = Array.from(document.querySelectorAll('*')).filter(el => {
      if (isExcluded(el) || el.children.length > 3) return false;
      const t = el.innerText || '';
      return t.includes('@contact.monster.com') || (t.includes('@') && !t.includes('support@') && !t.includes('info@'));
    });
    if (relayEmails.length > 0) {
      const parentContainer = relayEmails[0].closest('[class*="pane"], [class*="detail"], [class*="preview"], [class*="view"], section, div') || relayEmails[0].parentElement?.parentElement;
      if (parentContainer && (parentContainer.innerText || '').length > 200) {
        return parentContainer;
      }
    }

    return null;
  };

  // Extract clean text from an open Monster detail pane / resume viewer
  window.extractTextFromMonsterPane = function(pane) {
    if (!pane) return '';
    let fullText = '';

    // 1. Scan for multi-page containers within pane (DOCX/PDF document viewers: DocViewer, PDF.js, etc.)
    const pageElements = Array.from(pane.querySelectorAll(
      '[data-page-number], .page, .page-view, .pdf-page, .document-page, [class*="page-container"], [class*="rendered-page"], .textLayer, [class*="page_"], section[data-page]'
    )).filter(el => {
      const t = (el.innerText || el.textContent || '').trim();
      return t.length > 40 && !el.closest('#smarthire-copilot-drawer') && !el.closest('#smarthire-dossier-overlay');
    });

    if (pageElements.length > 0) {
      // Concatenate all detected pages in sequential DOM order
      const pageTexts = pageElements.map(p => (p.innerText || p.textContent || '').trim()).filter(Boolean);
      fullText = pageTexts.join('\n\n');
    }

    // 2. Dedicated resume viewers (if multi-page query did not yield longer text)
    const resumeViewers = pane.querySelectorAll(
      '[data-testid*="resume-view"], [data-testid*="resume-content"], [class*="resume-view"], [class*="resumeView"], [class*="document-viewer"], [class*="documentViewer"], [class*="resume-body"], [class*="resumeText"], pre, [class*="text-resume"]'
    );
    for (const rv of resumeViewers) {
      const txt = (rv.innerText || rv.textContent || '').trim();
      if (txt.length > fullText.length) fullText = txt;
    }

    // 3. Check iframes (PDF / HTML document viewers)
    const iframes = pane.querySelectorAll('iframe');
    for (const ifr of iframes) {
      try {
        const doc = ifr.contentDocument || ifr.contentWindow?.document;
        if (doc && doc.body) {
          const iframePages = Array.from(doc.querySelectorAll(
            '[data-page-number], .page, .page-view, .pdf-page, .document-page, [class*="page-container"], [class*="rendered-page"], .textLayer'
          )).filter(el => (el.innerText || el.textContent || '').trim().length > 40);

          if (iframePages.length > 0) {
            const combinedIframePages = iframePages.map(p => (p.innerText || p.textContent || '').trim()).join('\n\n');
            if (combinedIframePages.length > fullText.length) fullText = combinedIframePages;
          } else {
            const ifrText = (doc.body.innerText || doc.body.textContent || '').trim();
            if (ifrText.length > fullText.length) fullText = ifrText;
          }
        }
      } catch (e) {}
    }

    // If dedicated resume viewer or multi-page viewer produced authentic text >= 400 chars, return it directly!
    // Never pollute dedicated resume viewer text with profile tab snippets.
    if (fullText.length >= 400) {
      return window.cleanMonsterResumeText(fullText);
    }

    // 4. Fallback: Also scan work history and education sections if viewer text is short
    const profileSections = pane.querySelectorAll(
      '[data-testid*="work-history"], [class*="work-history"], [data-testid*="experience"], [class*="experience"], [class*="profile-content"], [class*="candidate-experience"], [class*="timeline"], [class*="education"], [data-testid*="education"]'
    );
    let profileSectionText = '';
    for (const ps of profileSections) {
      profileSectionText += '\n' + (ps.innerText || ps.textContent || '');
    }

    if (profileSectionText.length > fullText.length) {
      fullText = profileSectionText;
    }

    // 5. Fallback to full pane text
    const rawPane = (pane.innerText || pane.textContent || '').trim();
    if (rawPane.length > fullText.length) fullText = rawPane;

    return window.cleanMonsterResumeText(fullText);
  };

  // Extract authentic deep resume text from the entire Monster page
  window.extractDeepMonsterResumeText = function(candidateName = '') {
    const isExcluded = (el) => {
      if (!el) return true;
      if (el.closest('#smarthire-copilot-drawer') || el.closest('#smarthire-copilot-trigger') || el.closest('#smarthire-dossier-overlay')) return true;
      if (el.tagName === 'NAV' || el.tagName === 'HEADER' || el.tagName === 'FOOTER') return true;
      if (el.tagName.toLowerCase() === 'smui-card' || el.closest('smui-card')) return true;
      // Strictly exclude any container with multiple candidate cards (e.g. search results list, main)
      if (el.querySelectorAll('smui-card, [data-testid*="candidate-card"], [class*="CandidateCard"]').length > 1) return true;
      const t = el.innerText || '';
      if (t.includes('No candidate selected') || t.includes('Select a candidate from the results')) return true;
      return false;
    };

    const firstName = candidateName ? candidateName.trim().split(/\s+/)[0].toLowerCase() : '';
    const lastWord = candidateName ? candidateName.trim().split(/\s+/).slice(-1)[0].toLowerCase() : '';
    const nameMatches = (text) => {
      if (!candidateName) return true;
      const lower = (text || '').toLowerCase();
      if (firstName.length >= 3 && lower.includes(firstName)) return true;
      if (lastWord.length >= 3 && lower.includes(lastWord)) return true;
      return false;
    };

    let bestCandidateText = '';
    let longestFallbackText = '';

    const considerText = (raw) => {
      if (!raw) return;
      if (raw.includes('No candidate selected') || raw.includes('Select a candidate from the results')) return;
      const cleaned = window.cleanMonsterResumeText(raw);
      if (cleaned.length > longestFallbackText.length) {
        longestFallbackText = cleaned;
      }
      if (nameMatches(cleaned) && cleaned.length > bestCandidateText.length) {
        bestCandidateText = cleaned;
      }
    };

    // 1. Scan for rendered document pages (PDF.js / WebViewer textLayer / DOCX pages) anywhere on page
    const pageElements = Array.from(document.querySelectorAll(
      '[data-page-number], .page, .page-view, .pdf-page, .document-page, [class*="page-container"], [class*="rendered-page"], .textLayer, [class*="page_"], section[data-page]'
    )).filter(el => {
      if (isExcluded(el)) return false;
      const t = (el.innerText || el.textContent || '').trim();
      return t.length > 30;
    });

    if (pageElements.length > 0) {
      const pageTexts = pageElements.map(p => (p.innerText || p.textContent || '').trim()).filter(Boolean);
      considerText(pageTexts.join('\n\n'));
    }

    // 2. Scan dedicated resume viewer elements anywhere on the page
    const viewerSelectors = [
      '[data-testid*="resume-view"]',
      '[data-testid*="resume-content"]',
      '[data-testid*="document-viewer"]',
      '[data-testid*="resume"]',
      '[class*="document-viewer"]',
      '[class*="documentViewer"]',
      '[class*="resume-viewer"]',
      '[class*="resumeViewer"]',
      '[class*="resume-view"]',
      '[class*="resumeView"]',
      '[class*="resume-container"]',
      '[class*="resumeContainer"]',
      '[class*="resume-body"]',
      '[class*="resumeText"]',
      '[class*="text-resume"]',
      'pre'
    ];

    for (const sel of viewerSelectors) {
      const els = Array.from(document.querySelectorAll(sel)).filter(el => {
        if (isExcluded(el)) return false;
        if (el.tagName.toLowerCase() === 'smui-card' || el.closest('smui-card')) return false;
        return true;
      });
      for (const el of els) {
        considerText(el.innerText || el.textContent || '');
      }
    }

    // 3. Scan all iframes on page
    const iframes = Array.from(document.querySelectorAll('iframe')).filter(el => !isExcluded(el));
    for (const ifr of iframes) {
      try {
        const doc = ifr.contentDocument || ifr.contentWindow?.document;
        if (doc && doc.body) {
          const ifrPages = Array.from(doc.querySelectorAll(
            '[data-page-number], .page, .page-view, .pdf-page, .document-page, [class*="page-container"], [class*="rendered-page"], .textLayer'
          )).filter(el => (el.innerText || el.textContent || '').trim().length > 30);

          if (ifrPages.length > 0) {
            considerText(ifrPages.map(p => (p.innerText || p.textContent || '').trim()).join('\n\n'));
          } else {
            considerText(doc.body.innerText || doc.body.textContent || '');
          }
        }
      } catch (e) {}
    }

    // 4. Scan right-side preview pane / drawer containers (Monster Split View)
    const rightSideContainers = Array.from(document.querySelectorAll('div, section, article, aside, [role="dialog"], [class*="detail"], [class*="preview"], [class*="pane"], [class*="header"]')).filter(el => {
      if (isExcluded(el)) return false;
      if (el.tagName.toLowerCase() === 'smui-card' || el.closest('smui-card')) return false;
      const rect = el.getBoundingClientRect();
      return rect.width >= 200 && rect.height >= 30 && rect.left >= window.innerWidth * 0.20;
    });

    for (const container of rightSideContainers) {
      const sections = container.querySelectorAll(
        '[data-testid*="work-history"], [class*="work-history"], [data-testid*="experience"], [class*="experience"], [class*="profile-content"], [class*="candidate-experience"], [class*="timeline"], [class*="education"], [data-testid*="education"], [class*="contact"], [id*="contact"]'
      );
      if (sections.length > 0) {
        let secText = '';
        for (const s of sections) {
          secText += '\n' + (s.innerText || s.textContent || '');
        }
        considerText(secText);
      }

      considerText(container.innerText || container.textContent || '');
    }

    // 5. Fallback: If still under 800 chars, scan any container with career keywords
    if (bestCandidateText.length < 800 && (!candidateName || longestFallbackText.length < 800)) {
      const candidates = Array.from(document.querySelectorAll('section, article, main, aside, [role="main"], [role="dialog"]')).filter(el => {
        if (isExcluded(el)) return false;
        if (el.closest('smui-card')) return false;
        const t = (el.innerText || '').toLowerCase();
        return (t.includes('experience') || t.includes('employment history')) && (t.includes('education') || t.includes('skills'));
      });

      for (const c of candidates) {
        considerText(c.innerText || '');
      }
    }

    if (bestCandidateText && bestCandidateText.length > 0) {
      return bestCandidateText;
    }

    // If candidateName was given, only return fallback if it matches candidateName
    if (candidateName) {
      return nameMatches(longestFallbackText) ? longestFallbackText : '';
    }

    return longestFallbackText;
  };

  // Deep Resume Extractor from Active Drawer or Card (Synchronous)
  window.extractCleanMonsterResumeText = function(targetCard = null, candidateName = '') {
    // 1. Check deep text across entire document first
    const deepText = window.extractDeepMonsterResumeText(candidateName);
    if (deepText && deepText.length >= 300) {
      return deepText;
    }

    // 2. Check right detail pane / drawer specifically
    const pane = window.findMonsterDetailPane(candidateName);
    if (pane) {
      const paneText = window.extractTextFromMonsterPane(pane);
      if (paneText && paneText.length >= 300) {
        return paneText;
      }
    }

    // 3. Fallback to target card text if pane not available
    let fallbackText = '';
    if (targetCard) {
      fallbackText = (targetCard.innerText || '').trim();
    }
    return window.cleanMonsterResumeText(fallbackText);
  };

  // Asynchronous Resume Extractor: selects card, activates Resume tab, polls for document render
  window.extractCleanMonsterResumeTextAsync = async function(targetCard = null, candidateName = '', autoSwitchTabs = true) {
    const firstName = candidateName ? candidateName.trim().split(/\s+/)[0].toLowerCase() : '';
    const lastWord = candidateName ? candidateName.trim().split(/\s+/).slice(-1)[0].toLowerCase() : '';
    const nameMatches = (text) => {
      if (!candidateName) return true;
      const lower = (text || '').toLowerCase();
      if (firstName.length >= 3 && lower.includes(firstName)) return true;
      if (lastWord.length >= 3 && lower.includes(lastWord)) return true;
      return false;
    };

    // 1. Check if a matching detail pane is already open for THIS candidate
    let pane = window.findMonsterDetailPane(candidateName);
    let immediateText = '';

    // If matching pane is open and full resume document is ALREADY rendered in viewer, return immediately
    if (pane && nameMatches(pane.innerText || '')) {
      immediateText = window.extractDeepMonsterResumeText(candidateName) || '';
      if (immediateText && immediateText.length >= 1200 && nameMatches(immediateText)) {
        return {
          text: immediateText,
          rawLength: immediateText.length,
          sourceType: 'RESUME_DOCUMENT',
          isProvisional: false,
          error: null
        };
      }
    }

    // If no matching pane is open or pane belongs to another candidate, select card
    if (!pane || !nameMatches(pane.innerText || '')) {
      if (targetCard) {
        window.selectMonsterCandidateCard(targetCard);
      } else if (candidateName) {
        const foundCard = window.findMonsterCardByName(candidateName);
        if (foundCard) {
          window.selectMonsterCandidateCard(foundCard);
        }
      }

      // Poll for detail pane to render (up to 2000ms)
      const pollStart = Date.now();
      while (Date.now() - pollStart < 2000) {
        pane = window.findMonsterDetailPane(candidateName);
        if (pane && nameMatches(pane.innerText || '')) break;
        await sleep(100);
      }
    }

    // 3. If autoSwitchTabs is enabled, find and activate Monster's Resume tab
    if (autoSwitchTabs) {
      const resumeTab = window.findMonsterResumeTab(pane) || window.findMonsterResumeTab(document);
      if (resumeTab) {
        window.activateMonsterResumeTab(resumeTab);
      }
    }

    // 4. Poll for document viewer / multi-page DOCX/PDF to finish rendering (up to 3500ms)
    let lastLen = 0;
    let stableCount = 0;
    const tabPollStart = Date.now();
    let bestText = (immediateText && nameMatches(immediateText)) ? immediateText : '';

    while (Date.now() - tabPollStart < 3500) {
      // Trigger scroll down in viewer container to force virtualized pages (e.g. page 2, page 3) to render
      if (pane) {
        const scrollable = pane.querySelector('[class*="document-viewer"], [class*="resume-view"], [class*="documentViewer"], .document-viewer, [class*="viewer"]') || pane;
        if (scrollable && scrollable.scrollHeight > scrollable.clientHeight + 80) {
          scrollable.scrollTop = scrollable.scrollHeight;
        }
      }

      const text = window.extractDeepMonsterResumeText(candidateName);
      if (text && text.length > bestText.length && nameMatches(text)) {
        bestText = text;
      }

      if (bestText && bestText.length >= 2500) {
        break; // Full multi-page document rendered
      }
      if (bestText && bestText.length === lastLen && bestText.length >= 1000) {
        stableCount++;
        if (stableCount >= 3) break; // Text stabilized
      } else {
        stableCount = 0;
      }
      lastLen = bestText.length;
      await sleep(150);
    }

    // Reset scroll
    if (pane) {
      const scrollable = pane.querySelector('[class*="document-viewer"], [class*="resume-view"], [class*="documentViewer"], .document-viewer') || pane;
      if (scrollable) scrollable.scrollTop = 0;
    }

    if (bestText && bestText.length >= 1200) {
      return {
        text: bestText,
        rawLength: bestText.length,
        sourceType: 'RESUME_DOCUMENT',
        isProvisional: false,
        error: null
      };
    }

    if (bestText && bestText.length >= 250) {
      return {
        text: bestText,
        rawLength: bestText.length,
        sourceType: 'PROFILE_SNIPPET',
        isProvisional: true,
        error: `Partial profile snippet extracted (${bestText.length} chars). Full resume document not yet loaded in Monster split-view.`
      };
    }

    // 5. Fallback: Card text only
    let cardText = '';
    if (targetCard) {
      cardText = window.cleanMonsterResumeText(targetCard.innerText || '');
    }
    return {
      text: cardText,
      rawLength: cardText.length,
      sourceType: 'SEARCH_CARD_SNIPPET',
      isProvisional: true,
      error: 'Only search card text could be captured.'
    };
  };

  // Find all candidate cards on Monster+ (Browserflow selector: smui-card / result rows)
  window.getMonsterCards = function() {
    const isExcluded = (el) => {
      if (!el) return true;
      if (el.closest('#smarthire-copilot-drawer') || el.closest('#smarthire-copilot-trigger')) return true;
      // Exclude side drawer / profile detail view so we don't treat the detail pane as a candidate card
      if (el.closest('aside') || el.closest('[role="dialog"]') || el.closest('[class*="drawer"]')) return true;
      return false;
    };

    // Strategy 1: smui-card tag in candidate results area
    const smuiCards = Array.from(document.querySelectorAll('smui-card')).filter(c => !isExcluded(c));
    if (smuiCards.length > 1) return smuiCards;

    // Strategy 2: elements containing candidate checkboxes (Monster+ search cards all have a selection checkbox)
    const candidateCheckboxes = Array.from(document.querySelectorAll('input[type="checkbox"], smui-checkbox, [role="checkbox"]')).filter(cb => {
      if (isExcluded(cb)) return false;
      const aria = (cb.getAttribute('aria-label') || '').toLowerCase();
      return !aria.includes('select all') && !aria.includes('all candidate');
    });

    if (candidateCheckboxes.length > 0) {
      const cardList = [];
      const seen = new Set();
      candidateCheckboxes.forEach(cb => {
        const card = cb.closest('smui-card') || 
                     cb.closest('[class*="smui-card"]') || 
                     cb.closest('[class*="card"]') || 
                     cb.closest('article') || 
                     cb.closest('li') || 
                     cb.parentElement?.parentElement?.parentElement;
        if (card && !seen.has(card) && !isExcluded(card)) {
          seen.add(card);
          cardList.push(card);
        }
      });
      if (cardList.length > 0) return cardList;
    }

    // Strategy 3: class containing smui-card
    const cardsByClass = Array.from(document.querySelectorAll('[class*="smui-card"]')).filter(el => {
      if (isExcluded(el)) return false;
      return el.tagName.toLowerCase() === 'smui-card' || 
             (!el.classList.contains('smui-card-body') && !el.classList.contains('smui-card-header') && el.querySelector('.smui-card-body'));
    });
    if (cardsByClass.length > 0) return cardsByClass;

    // Strategy 4: Candidate result cards by testid or article
    const candidates = Array.from(document.querySelectorAll('[data-testid*="candidate-card"], [data-testid*="candidate-item"], article')).filter(c => !isExcluded(c));
    if (candidates.length > 0) return candidates;

    // Strategy 5: Cards with candidate name links
    const nameLinks = Array.from(document.querySelectorAll('a[href*="/candidate/"], a[href*="/candidates/"]')).filter(a => !isExcluded(a));
    if (nameLinks.length > 0) {
      const cardSet = new Set();
      nameLinks.forEach(a => {
        const c = a.closest('smui-card') || a.closest('article') || a.closest('li') || a.parentElement?.parentElement;
        if (c && !isExcluded(c)) cardSet.add(c);
      });
      if (cardSet.size > 0) return Array.from(cardSet);
    }

    if (smuiCards.length > 0) return smuiCards;
    return [];
  };

  // Extract contact strictly for a target candidate or card container
  window.extractMonsterContact = function(cardEl = null, expectedCandidateName = '') {
    let phone = '';
    let email = '';

    const firstWord = expectedCandidateName ? expectedCandidateName.trim().split(/\s+/)[0].toLowerCase() : '';
    const lastWord = expectedCandidateName ? expectedCandidateName.trim().split(/\s+/).slice(-1)[0].toLowerCase() : '';

    const cleanEmail = (raw) => {
      if (!raw) return '';
      const em = raw.trim().toLowerCase();
      if (em.includes('coolsofttech') || em.includes('smarthireus')) return '';
      if (em.startsWith('support@') || em.startsWith('info@') || em.startsWith('sales@') ||
          em.startsWith('careers@') || em.startsWith('jobs@') || em.startsWith('privacy@') ||
          em.startsWith('help@') || em.startsWith('donotreply@') || em.startsWith('noreply@')) return '';
      if (em.includes('monster.com') && !em.endsWith('@contact.monster.com')) return '';
      return em;
    };

    const cleanPhone = (raw) => {
      if (!raw) return '';
      const p = utils.extractPhones(raw);
      if (p.length > 0 && !p[0].includes('555-01')) return p[0];
      return '';
    };

    // 1. First, check inside specific candidate card element if provided
    if (cardEl) {
      const cardMailLinks = cardEl.querySelectorAll('a[href^="mailto:"]');
      for (const a of cardMailLinks) {
        const c = cleanEmail(a.href.replace(/^mailto:/i, '').split('?')[0]);
        if (c) { email = c; break; }
      }
      const cardTelLinks = cardEl.querySelectorAll('a[href^="tel:"]');
      for (const a of cardTelLinks) {
        const c = cleanPhone(a.href.replace(/^tel:/i, ''));
        if (c) { phone = c; break; }
      }
      if (!email) {
        const cEmails = utils.extractEmails(cardEl.innerText || '').map(cleanEmail).filter(Boolean);
        if (cEmails.length > 0) email = cEmails[0];
      }
      if (!phone) {
        const cPhones = utils.extractPhones(cardEl.innerText || '').map(cleanPhone).filter(Boolean);
        if (cPhones.length > 0) phone = cPhones[0];
      }
      if (email && phone) return { phone, email };
    }

    const isExcluded = (el) => {
      if (!el) return true;
      if (el.closest('#smarthire-copilot-drawer') || el.closest('#smarthire-copilot-trigger') || el.closest('#smarthire-dossier-overlay')) return true;
      if (el.tagName.toLowerCase() === 'smui-card' || el.closest('smui-card')) return true;
      return false;
    };

    // 2. High-precision regex pattern scanning across all elements in right pane
    const rightElements = Array.from(document.querySelectorAll('div, section, article, aside, p, span, li, a, h1, h2, h3, h4, header')).filter(el => {
      if (isExcluded(el)) return false;
      const rect = el.getBoundingClientRect();
      return rect.left >= window.innerWidth * 0.20 && rect.width >= 20 && rect.height >= 10;
    });

    for (const el of rightElements) {
      const txt = (el.innerText || el.textContent || '').trim();
      if (!txt) continue;

      if (!email) {
        // Pattern: Email: <email> OR E-mail: <email> OR Mail: <email> OR Contact: <email>
        const emMatch = txt.match(/(?:Email|E-mail|Mail|Contact)[\s\S]{0,15}[:\s]\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
        if (emMatch) {
          const ce = cleanEmail(emMatch[1]);
          if (ce) email = ce;
        }
      }

      if (!phone) {
        // Pattern: Phone: <phone> OR Cell: <phone> OR Mobile: <phone> OR Home: <phone> OR Tel: <phone>
        const phMatch = txt.match(/(?:Phone|Cell|Mobile|Tel|Telephone|Home|Work|Primary)[\s\S]{0,15}[:\s]\s*(\+?1?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/i);
        if (phMatch) {
          const cp = cleanPhone(phMatch[1]);
          if (cp) phone = cp;
        }
      }

      if (email && phone) break;
    }

    // 3. Scan mailto: and tel: links in right-side preview area
    if (!email || !phone) {
      const rightLinks = Array.from(document.querySelectorAll('a[href^="mailto:"], a[href^="tel:"]')).filter(a => {
        if (isExcluded(a)) return false;
        const rect = a.getBoundingClientRect();
        return rect.left >= window.innerWidth * 0.20;
      });

      for (const a of rightLinks) {
        if (!email && a.href.startsWith('mailto:')) {
          const clean = cleanEmail(a.href.replace(/^mailto:/i, '').split('?')[0]);
          if (clean) email = clean;
        }
        if (!phone && a.href.startsWith('tel:')) {
          const clean = cleanPhone(a.href.replace(/^tel:/i, ''));
          if (clean) phone = clean;
        }
        if (email && phone) break;
      }
    }

    // 4. Scan dedicated contact legend / header containers for raw emails and phones
    if (!email || !phone) {
      const contactContainers = Array.from(document.querySelectorAll(
        '[data-testid*="contact"], [class*="contact"], [class*="Contact"], [class*="phone"], [class*="email"], [class*="legend"], [class*="header"], [data-testid*="candidate-header"]'
      )).filter(el => {
        if (isExcluded(el)) return false;
        const rect = el.getBoundingClientRect();
        return rect.left >= window.innerWidth * 0.20;
      });

      for (const box of contactContainers) {
        const boxText = box.innerText || box.textContent || '';
        if (!email) {
          const found = utils.extractEmails(boxText).map(cleanEmail).filter(Boolean);
          if (found.length > 0) email = found[0];
        }
        if (!phone) {
          const foundP = utils.extractPhones(boxText).map(cleanPhone).filter(Boolean);
          if (foundP.length > 0) phone = foundP[0];
        }
        if (email && phone) break;
      }
    }

    // 5. Search right containers for general contact text
    if (!email || !phone) {
      const rightContainers = Array.from(document.querySelectorAll('div, section, article, aside, [role="dialog"], [class*="detail"], [class*="preview"], [class*="pane"], [class*="contact"], header')).filter(el => {
        if (isExcluded(el)) return false;
        const rect = el.getBoundingClientRect();
        return rect.width >= 150 && rect.height >= 30 && rect.left >= window.innerWidth * 0.20;
      });

      for (const container of rightContainers) {
        const containerText = container.innerText || container.textContent || '';
        if (!email) {
          const foundEmails = utils.extractEmails(containerText).map(cleanEmail).filter(Boolean);
          if (foundEmails.length > 0) email = foundEmails[0];
        }
        if (!phone) {
          const foundPhones = utils.extractPhones(containerText).map(cleanPhone).filter(Boolean);
          if (foundPhones.length > 0) phone = foundPhones[0];
        }

        if (email && phone) break;
      }
    }

    return { phone, email };
  };

  // Deep Scraper: Click each card, reveal details with polling, extract verified contact info
  window.smartHireScrapeCandidatesAsync = async function(onProgress) {
    const cards = window.getMonsterCards();
    console.log(`[SmartHire Copilot v3.9] Found ${cards.length} cards for deep scrape.`);

    if (cards.length === 0) {
      if (typeof onProgress === 'function') {
        onProgress('No candidate cards found on this page.');
      }
      return [];
    }

    const candidates = [];
    const seenNames = new Set();

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      try {
        const cardText = card.innerText || '';
        let rawName = window.extractCleanMonsterName(cardText);

        // Candidate Name (STRICTLY FROM THIS CARD CONTAINER FIRST)
        let name = '';
        const cardNameEl = card.querySelector('a[href*="/candidate/"], a[href*="/candidates/"], h2, h3, h4, [class*="name"], [class*="Name"]');
        if (cardNameEl && cardNameEl.innerText.trim()) {
          name = window.extractCleanMonsterName(cardNameEl.innerText);
        }
        if (!name || name.length < 2) {
          name = rawName || `Candidate ${i + 1}`;
        }
        name = name.replace(/sms\s*opt-in/gi, '').replace(/viewed/gi, '').replace(/·/g, '').trim();

        // Check deduplication per candidate name on card BEFORE doing costly operations
        const nameKey = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (seenNames.has(nameKey)) {
          console.log(`[SmartHire Copilot] Skipping already seen candidate: ${name}`);
          continue;
        }

        // Title Extraction (Robust: extracts Current/Previous, never assigns Date or raw numbers)
        let title = '';

        // Priority 1: Match "Current: <Title>" directly from card text
        const currentMatch = cardText.match(/Current:\s*([^\n\r·]+)/i);
        if (currentMatch && currentMatch[1].trim().length > 2) {
          title = currentMatch[1].trim();
        }

        // Priority 2: Match "Previous: <Title>" if no Current found
        if (!title) {
          const prevMatch = cardText.match(/Previous:\s*([^\n\r·]+)/i);
          if (prevMatch && prevMatch[1].trim().length > 2) {
            title = prevMatch[1].trim();
          }
        }

        // Priority 3: Scan candidate card line by line, excluding dates, metadata, and noise
        if (!title) {
          const lines = cardText.split('\n').map(l => l.trim()).filter(Boolean);
          for (const line of lines) {
            const cleanLine = window.extractCleanMonsterName(line);
            const lower = cleanLine.toLowerCase();
            if (
              cleanLine &&
              cleanLine !== name &&
              cleanLine.length > 3 &&
              !lower.startsWith('date') &&
              !lower.startsWith('updated') &&
              !lower.startsWith('active') &&
              !lower.startsWith('select a card') &&
              !lower.startsWith('viewed') &&
              !lower.startsWith('sms') &&
              !lower.startsWith('top skills') &&
              !lower.includes('united states') &&
              !/^\d+[\s+]*years?/i.test(cleanLine) &&
              !/^\d+$/.test(cleanLine) &&
              !/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(cleanLine) &&
              /[a-zA-Z]{3,}/.test(cleanLine)
            ) {
              title = cleanLine;
              break;
            }
          }
        }

        // Priority 4: Clean any leftover prefixes or junk
        if (title) {
          title = title
            .replace(/^Current:\s*/i, '')
            .replace(/^Previous:\s*/i, '')
            .replace(/^Date:\s*/i, '')
            .replace(/\b(?:Date|Updated|Active|Viewed)\b:?/gi, '')
            .trim();
        }

        if (!title || /^date:?/i.test(title) || /^\d+$/.test(title) || title === 'Candidate Profile') {
          title = 'Candidate Profile';
        }

        // Location Extraction (Clean City, State; avoids multiline noise)
        let location = window.extractCleanMonsterLocation(cardText);
        if (!location) {
          const locEl = card.querySelector('[data-testid*="location"], [class*="location"]');
          if (locEl) {
            location = window.extractCleanMonsterLocation(locEl.innerText || locEl.textContent || '');
          }
        }

        // Experience & Recency
        const experience = utils.extractExperience(cardText) || '5+ Years';
        let recency = 'Active on Monster+';
        const recMatch = cardText.match(/Updated:\s*([^\n\r·]+)/i);
        if (recMatch) recency = `Updated ${recMatch[1].trim()}`;

        // Skills
        const skills = [];
        const skillMatch = cardText.match(/Top Skills:\s*([^\n\r]+)/i);
        if (skillMatch) {
          const rawSkills = skillMatch[1].replace(/\+\d+\s*more/i, '').split(',');
          rawSkills.forEach(s => {
            const trimmed = s.trim();
            if (trimmed && !skills.includes(trimmed)) skills.push(trimmed);
          });
        }

        seenNames.add(nameKey);

        if (typeof onProgress === 'function') {
          onProgress(`Processing candidate ${i + 1} of ${cards.length} (${name})...`);
        }

        // 1. Check card contact directly
        let email = '';
        let phone = '';
        const cardContact = window.extractMonsterContact(card, name);
        if (cardContact.email) email = cardContact.email;
        if (cardContact.phone) phone = cardContact.phone;

        // 2. Select card to open detail pane in Monster's split view
        window.selectMonsterCandidateCard(card);

        // 3. Short pause for Monster's right-side detail pane to update
        await sleep(350);

        // Sniff detail pane immediately for contact info
        const paneDirect = window.extractMonsterContact(null, name);
        if (!email && paneDirect.email) email = paneDirect.email;
        if (!phone && paneDirect.phone) phone = paneDirect.phone;

        // 4. Extract authentic clean resume text from right detail pane / Resume document
        const extRes = await window.extractCleanMonsterResumeTextAsync(card, name, true);
        let candidateFullText = extRes.text;
        if (!candidateFullText || candidateFullText.length < 50) {
          candidateFullText = window.cleanMonsterResumeText(cardText);
        }

        // 5. Reconcile Location if not found on card
        if (!location || location === 'United States') {
          const rightLoc = window.extractCleanMonsterLocation(candidateFullText.slice(0, 2500));
          if (rightLoc) location = rightLoc;
        }
        if (!location) location = 'United States';

        // 6. Verified Contact Extraction: Scan resume text, then confirmed detail pane, then card
        if (!email) email = window.extractCandidateEmailFromText(candidateFullText);
        if (!phone) phone = window.extractCandidatePhoneFromText(candidateFullText);

        if (!email || !phone) {
          const paneContact = window.extractMonsterContact(null, name);
          if (!email && paneContact.email) email = paneContact.email;
          if (!phone && paneContact.phone) phone = paneContact.phone;
        }

        if (!email || !phone) {
          if (!email && cardContact.email) email = cardContact.email;
          if (!phone && cardContact.phone) phone = cardContact.phone;
        }

        if (!email) email = window.extractCandidateEmailFromText(cardText);
        if (!phone) phone = window.extractCandidatePhoneFromText(cardText);

        const candidateItem = {
          id: `mon-${i}-${Date.now().toString().slice(-4)}`,
          name,
          title: title.slice(0, 80),
          email: email || '',
          phone: phone || '',
          location,
          experience,
          skills: skills.slice(0, 15),
          source: 'Monster+',
          recency,
          profileUrl: window.location.href,
          notes: `${recency} · Sourced via SmartHire Copilot.`,
          resumeText: candidateFullText,
          summary: candidateFullText.slice(0, 5000),
          resumeSourceType: extRes.sourceType || 'RESUME_DOCUMENT'
        };

        // Complete Resume Extraction & Verification
        if (window.SmartHireMatchingEngine && typeof window.SmartHireMatchingEngine.verifyAndClassifyResume === 'function') {
          const v = window.SmartHireMatchingEngine.verifyAndClassifyResume(candidateItem);
          candidateItem.extractionStatus = v.status;
          candidateItem.sourceSectionsFound = v.sourceSectionsFound;
          candidateItem.isTruncated = v.isTruncated;
          candidateItem.extractedLength = v.extractedLength;
          candidateItem.missingExpectedSections = v.missingExpectedSections;
          candidateItem.extractionWarnings = v.warnings;
          candidateItem.isProvisional = v.isProvisional;
          candidateItem.extractionVerification = v;
        } else {
          candidateItem.extractionStatus = candidateFullText.length >= 500 ? 'FULL_RESUME_EXTRACTED' : (candidateFullText.length >= 150 ? 'PARTIAL_RESUME_EXTRACTED' : 'PROFILE_ONLY');
          candidateItem.extractedLength = candidateFullText.length;
          candidateItem.isProvisional = candidateFullText.length < 500;
        }

        candidates.push(candidateItem);

        if (typeof onProgress === 'function') {
          const contactStatus = (email || phone) ? `(${[email, phone].filter(Boolean).join(' · ')})` : '(No contact disclosed)';
          onProgress(`Extracted ${candidates.length} of ${cards.length}: ${name} ${contactStatus}`);
        }
      } catch (err) {
        console.warn(`[SmartHire Copilot] Error processing card ${i}:`, err);
      }
    }

    if (typeof onProgress === 'function') {
      onProgress(`✓ Extracted ${candidates.length} candidate(s) successfully!`);
    }

    return candidates;
  };

  // Quick fallback
  window.smartHireScrapeCandidates = function() {
    const cards = window.getMonsterCards();
    const candidates = [];
    cards.forEach((card, i) => {
      const cardText = card.innerText || '';
      const name = window.extractCleanMonsterName(cardText) || `Candidate ${i + 1}`;
      if (name.toLowerCase().includes('monster')) return;

      const contact = window.extractMonsterContact(card, name);
      const email = contact.email || window.extractCandidateEmailFromText(cardText) || '';
      const phone = contact.phone || window.extractCandidatePhoneFromText(cardText) || '';
      const location = window.extractCleanMonsterLocation(cardText) || 'United States';

      candidates.push({
        id: `mon-sync-${i}-${Date.now().toString().slice(-4)}`,
        name,
        title: 'Candidate Profile',
        email,
        phone,
        location,
        experience: utils.extractExperience(cardText) || '5+ Years',
        skills: [],
        source: 'Monster+',
        profileUrl: window.location.href,
        resumeText: cardText,
        summary: cardText.slice(0, 4000)
      });
    });

    return candidates;
  };

  // Auto-Fill Search for Monster+
  window.smartHireAutoFillSearch = function({ title, skillsQuery, query, location }) {
    let cleanTitle = (title || '').trim();
    if (window.SmartHireMatchingEngine && typeof window.SmartHireMatchingEngine.cleanJobTitleForSearch === 'function') {
      cleanTitle = window.SmartHireMatchingEngine.cleanJobTitleForSearch(cleanTitle);
    } else {
      cleanTitle = cleanTitle
        .replace(/#\d+/g, ' ')
        .replace(/\bREQ[-_]?\d+\b/gi, ' ')
        .replace(/\b159\d{3}\b/g, ' ')
        .replace(/\([^)]*\)/g, ' ')
        .replace(/\[[^\]]*\]/g, ' ')
        .replace(/[-—–|/\\:_;~]+/g, ' ')
        .replace(/\b(?:level|lvl|tier|grade|step)\s*(?:[0-9]+|[ivx]+)?\b/gi, ' ')
        .replace(/\b[lt][0-9]+\b/gi, ' ')
        .replace(/\b(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV)\b/gi, ' ')
        .replace(/\b\d+\b/g, ' ')
        .replace(/\d+/g, ' ')
        .replace(/\b(?:senior|sr\.?|advance|advanced|junior|jr\.?|principal|lead|staff|associate|entry(?:\s+level)?)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    const cleanSkills = skillsQuery || query || '';
    const cleanLoc = (location || '').toLowerCase() === 'remote' ? '' : (location || '');

    function findInput(patterns) {
      const allInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="search"], input:not([type])'));
      for (const pattern of patterns) {
        for (const inp of allInputs) {
          const ph = (inp.placeholder || '').toLowerCase();
          const name = (inp.name || '').toLowerCase();
          const id = (inp.id || '').toLowerCase();
          const aria = (inp.getAttribute('aria-label') || '').toLowerCase();
          const parentText = (inp.closest('div')?.parentElement?.innerText || '').toLowerCase();

          if (
            ph.includes(pattern) ||
            name.includes(pattern) ||
            id.includes(pattern) ||
            aria.includes(pattern) ||
            parentText.startsWith(pattern)
          ) {
            return inp;
          }
        }
      }
      return null;
    }

    const titleInp = findInput(['cook, developer, nurse', 'job title', 'jobtitle', 'title']);
    if (titleInp && cleanTitle) utils.setNativeValue(titleInp, cleanTitle);

    const skillsInp = findInput(['javascript, management, finance', 'skills / keywords', 'skills/keywords', 'boolean', 'skills', 'keyword']);
    if (skillsInp && cleanSkills) utils.setNativeValue(skillsInp, cleanSkills);

    const locInp = findInput(['city, state, or zip', 'city, state', 'location', 'zip']);
    if (locInp && cleanLoc) utils.setNativeValue(locInp, cleanLoc);

    const allButtons = Array.from(document.querySelectorAll('button'));
    const updateBtn = allButtons.find(b => {
      const txt = (b.innerText || '').trim().toUpperCase();
      return txt === 'UPDATE' || txt.includes('UPDATE SEARCH');
    });

    if (updateBtn) {
      setTimeout(() => { updateBtn.click(); }, 300);
      return `Filled Title, Skills, and Location, and clicked UPDATE!`;
    }

    const searchBtn = allButtons.find(b => {
      const txt = (b.innerText || '').toLowerCase();
      return txt.includes('find candidates') || txt.includes('search') || b.getAttribute('data-testid')?.includes('search');
    });

    if (searchBtn) {
      setTimeout(() => { searchBtn.click(); }, 300);
      return `Filled Title, Skills, and Location, and clicked Find Candidates!`;
    } else if (titleInp || skillsInp || locInp) {
      const targetInp = locInp || skillsInp || titleInp;
      targetInp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
      return `Injected search parameters and submitted!`;
    } else {
      return `Search inputs not currently visible on page. Please expand Monster's search filters on the left.`;
    }
  };
})();
