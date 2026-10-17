// SmartHire Sourcing Copilot v3.6 - Monster+ Content Script
(function() {
  window.smartHirePortal = 'Monster+';
  console.log('[SmartHire Copilot v3.6] Monster+ content script loaded on:', window.location.href);

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

  // Extract contact from candidate profile, side drawer, shadow DOM, or detail panel
  window.extractMonsterContact = function() {
    let phone = '';
    let email = '';

    // 1. Sniff direct mailto links anywhere in light DOM and shadow roots
    const mailLinks = (utils.queryDeepAll ? utils.queryDeepAll('a[href^="mailto:"]') : Array.from(document.querySelectorAll('a[href^="mailto:"]')))
      .filter(a => !a.closest('#smarthire-copilot-drawer'));
    for (const a of mailLinks) {
      const clean = a.href.replace(/^mailto:/i, '').split('?')[0].trim().toLowerCase();
      if (clean && !clean.startsWith('support@') && !clean.startsWith('info@') && !clean.startsWith('privacy@')) {
        email = clean;
        break;
      }
    }

    // 2. Sniff direct tel links anywhere in light DOM and shadow roots
    const telLinks = (utils.queryDeepAll ? utils.queryDeepAll('a[href^="tel:"]') : Array.from(document.querySelectorAll('a[href^="tel:"]')))
      .filter(a => !a.closest('#smarthire-copilot-drawer'));
    for (const a of telLinks) {
      const clean = a.href.replace(/^tel:/i, '').trim();
      const extracted = utils.extractPhones(clean);
      if (extracted.length > 0) {
        phone = extracted[0];
        break;
      } else if (clean.length >= 7) {
        phone = clean;
        break;
      }
    }

    // 3. Search dedicated contact containers & legend boxes
    const contactBoxSelectors = [
      '#contact-legend-detail',
      '[id*="contact-legend"]',
      '[data-testid*="contact"]',
      '[data-testid*="phone"]',
      '[data-testid*="email"]',
      '[class*="contact-legend"]',
      '[class*="candidate-contact"]',
      '[class*="contact-info"]',
      '[class*="ContactInfo"]',
      '.candidate-header'
    ];

    let contactBox = null;
    for (const sel of contactBoxSelectors) {
      contactBox = utils.queryDeep ? utils.queryDeep(sel) : document.querySelector(sel);
      if (contactBox && !contactBox.closest('#smarthire-copilot-drawer')) break;
    }

    if (contactBox) {
      const boxText = contactBox.innerText || contactBox.textContent || '';

      if (!email) {
        const mailLink = contactBox.querySelector ? contactBox.querySelector('a[href^="mailto:"]') : null;
        if (mailLink) {
          email = mailLink.href.replace(/^mailto:/i, '').split('?')[0].trim().toLowerCase();
        } else {
          const foundEmails = utils.extractEmails(boxText);
          if (foundEmails.length > 0) email = foundEmails[0];
        }
      }

      if (!phone) {
        const telLink = contactBox.querySelector ? contactBox.querySelector('a[href^="tel:"]') : null;
        if (telLink) {
          phone = telLink.href.replace(/^tel:/i, '').trim();
        } else {
          const foundPhones = utils.extractPhones(boxText);
          if (foundPhones.length > 0) phone = foundPhones[0];
        }
      }
    }

    // 4. Fallback: Search side drawer, detail pane, or full resume pane text (including shadow roots)
    if (!email || !phone) {
      const detailPanes = (utils.queryDeepAll 
        ? utils.queryDeepAll('[class*="resume"], [class*="detail"], [class*="profile"], [class*="drawer"], [class*="Drawer"], aside, [role="dialog"]')
        : Array.from(document.querySelectorAll('[class*="resume"], [class*="detail"], [class*="profile"], [class*="drawer"], [class*="Drawer"], aside, [role="dialog"]'))
      ).filter(p => !p.closest('#smarthire-copilot-drawer'));

      for (const p of detailPanes) {
        const txt = utils.getTextDeep ? utils.getTextDeep(p) : (p.innerText || p.textContent || '');
        if (txt.includes('@') || txt.includes('Phone') || txt.includes('Mobile') || txt.includes('Cell') || txt.includes('(')) {
          if (!email) {
            const foundEmails = utils.extractEmails(txt);
            if (foundEmails.length > 0) email = foundEmails[0];
          }
          if (!phone) {
            const foundPhones = utils.extractPhones(txt);
            if (foundPhones.length > 0) phone = foundPhones[0];
          }
          if (email && phone) break;
        }
      }
    }

    return { phone, email };
  };

  // Deep Scraper: Click each card, reveal details with polling, extract verified contact info
  window.smartHireScrapeCandidatesAsync = async function(onProgress) {
    const cards = window.getMonsterCards();
    console.log(`[SmartHire Copilot v3.7] Found ${cards.length} cards for deep scrape.`);

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

        if (typeof onProgress === 'function') {
          onProgress(`Processing candidate ${i + 1} of ${cards.length} (${rawName || 'Candidate'})...`);
        }

        // Click .smui-card-body or card to open details
        const clickTarget = card.querySelector('.smui-card-body') || 
                            card.querySelector('div') || 
                            card;

        clickTarget.scrollIntoView({ behavior: 'auto', block: 'nearest' });
        clickTarget.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        clickTarget.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        clickTarget.click();

        // Dynamic Polling: Wait up to 1800ms for detail pane to render contact details
        let phone = '';
        let email = '';
        const pollStart = Date.now();

        while (Date.now() - pollStart < 1800) {
          // Click Profile tab if present and not yet active
          const profileTab = document.querySelector('li:nth-of-type(2) > .tab__title > .tab__label') ||
                             Array.from(document.querySelectorAll('.tab__label, button, [role="tab"]')).find(t => 
                               t.innerText && t.innerText.trim().toLowerCase() === 'profile'
                             );
          if (profileTab && !profileTab.closest('.tab--active') && !profileTab.classList.contains('active')) {
            profileTab.click();
          }

          const contact = window.extractMonsterContact();
          if (contact.email) email = contact.email;
          if (contact.phone) phone = contact.phone;

          if (email && phone) break;
          await sleep(150);
        }

        // If contact not found in drawer, check card text as fallback
        if (!email || !phone) {
          const cardEmails = utils.extractEmails(cardText);
          const cardPhones = utils.extractPhones(cardText);
          if (!email && cardEmails.length > 0) email = cardEmails[0];
          if (!phone && cardPhones.length > 0) phone = cardPhones[0];
        }

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

        // Check deduplication per candidate name on card
        const nameKey = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (seenNames.has(nameKey)) {
          console.log(`[SmartHire Copilot] Skipping already seen candidate: ${name}`);
          continue;
        }

        // Title
        let title = 'Candidate Profile';
        const lines = cardText.split('\n').map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
          const cleanLine = window.extractCleanMonsterName(line);
          if (
            cleanLine &&
            cleanLine !== name &&
            cleanLine.length > 3 &&
            !cleanLine.includes('Updated') &&
            !cleanLine.includes('Current:') &&
            !cleanLine.includes('Previous:') &&
            !cleanLine.includes('Top Skills:') &&
            !cleanLine.includes('Select a Card') &&
            !cleanLine.includes('Viewed') &&
            !cleanLine.includes('SMS Opt-in')
          ) {
            title = cleanLine;
            break;
          }
        }

        // Location
        let location = 'United States';
        const locMatch = cardText.match(/\b([A-Z][a-zA-Z\s.-]+),\s*([A-Z]{2}|[A-Za-z\s]+)\b/);
        if (locMatch && !locMatch[0].includes('Select a Card') && !locMatch[0].includes('Open In')) {
          location = locMatch[0].trim();
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

        // Extract full resume/drawer profile text if open
        let drawerResumeText = '';
        const drawerPanes = (utils.queryDeepAll 
          ? utils.queryDeepAll('[class*="resume"], [class*="detail"], [class*="profile"], [class*="drawer"], [class*="Drawer"], aside, [role="dialog"]')
          : Array.from(document.querySelectorAll('[class*="resume"], [class*="detail"], [class*="profile"], [class*="drawer"], [class*="Drawer"], aside, [role="dialog"]'))
        ).filter(p => !p.closest('#smarthire-copilot-drawer'));

        for (const p of drawerPanes) {
          const txt = utils.getTextDeep ? utils.getTextDeep(p) : (p.innerText || p.textContent || '');
          if (txt.length > drawerResumeText.length && txt.length > 80) {
            drawerResumeText = txt.trim();
          }
        }

        const candidateFullText = (drawerResumeText && drawerResumeText.length > 120)
          ? drawerResumeText
          : cardText;

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
          summary: candidateFullText.slice(0, 5000)
        };

        // Complete Resume Extraction & Verification (Section 4)
        if (window.SmartHireMatchingEngine && typeof window.SmartHireMatchingEngine.verifyAndClassifyResume === 'function') {
          const v = window.SmartHireMatchingEngine.verifyAndClassifyResume(candidateItem);
          candidateItem.extractionStatus = v.status;
          candidateItem.sourceSectionsFound = v.sourceSectionsFound;
          candidateItem.isTruncated = v.isTruncated;
          candidateItem.extractedLength = v.extractedLength;
          candidateItem.missingExpectedSections = v.missingExpectedSections;
          candidateItem.extractionWarnings = v.warnings;
          candidateItem.isProvisional = v.isProvisional;
        } else {
          candidateItem.extractionStatus = candidateFullText.length > 800 ? 'FULL_RESUME_EXTRACTED' : (candidateFullText.length > 250 ? 'PARTIAL_RESUME_EXTRACTED' : 'PROFILE_ONLY');
          candidateItem.extractedLength = candidateFullText.length;
          candidateItem.isProvisional = candidateFullText.length < 800;
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
    const contact = window.extractMonsterContact();

    cards.forEach((card, i) => {
      const cardText = card.innerText || '';
      const name = window.extractCleanMonsterName(cardText) || `Candidate ${i + 1}`;
      if (name.toLowerCase().includes('monster')) return;

      const email = (i === 0 && contact.email) ? contact.email : '';
      const phone = (i === 0 && contact.phone) ? contact.phone : '';

      candidates.push({
        id: `mon-sync-${i}-${Date.now().toString().slice(-4)}`,
        name,
        title: 'Candidate Profile',
        email,
        phone,
        location: 'United States',
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
    const cleanTitle = (title || '').replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
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
      const directUrl = `https://manage.monster.com/en-us/candidateSearch/job?title=${encodeURIComponent(cleanTitle)}&keywords=${encodeURIComponent(cleanSkills)}&location=${encodeURIComponent(cleanLoc)}`;
      window.location.href = directUrl;
      return `Navigating directly to Monster+ search.`;
    }
  };
})();
