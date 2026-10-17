// SmartHire Sourcing Copilot - Dice Content Script
(function() {
  window.smartHirePortal = 'Dice';
  console.log('[SmartHire Copilot] Dice scraper initialized on:', window.location.href);

  // Main scraper function for Dice candidate search results
  window.smartHireScrapeCandidates = function() {
    const candidates = [];
    const utils = window.SmartHireUtils;

    // Card selectors used across Dice Employer & Talent Search platforms
    const cardSelectors = [
      'dhi-search-card',
      'dhi-candidate-card',
      '[data-cy="search-result-card"]',
      '[data-cy="candidate-card"]',
      '[data-testid*="candidate-card"]',
      '[class*="search-card"]',
      '[class*="CandidateCard"]',
      '[class*="candidate-row"]',
      'article[class*="card"]',
      'div[class*="result-card"]'
    ];

    let cardElements = [];
    for (const sel of cardSelectors) {
      const els = document.querySelectorAll(sel);
      if (els && els.length > 0) {
        cardElements = Array.from(els);
        break;
      }
    }

    // Fallback: search for candidate name links or profile links
    if (cardElements.length === 0) {
      const links = document.querySelectorAll('a[data-cy*="candidate"], a[href*="/candidates/"], a[href*="/profile/"], a[href*="/talent/"]');
      const parents = new Set();
      links.forEach(link => {
        let parent = link.closest('article') || link.closest('dhi-search-card') || link.closest('div[class*="card"]') || link.parentElement?.parentElement?.parentElement;
        if (parent && !parents.has(parent)) {
          parents.add(parent);
          cardElements.push(parent);
        }
      });
    }

    console.log(`[SmartHire Copilot] Found ${cardElements.length} candidate cards on Dice`);

    cardElements.forEach((card, index) => {
      try {
        const cardText = utils.getTextDeep ? utils.getTextDeep(card) : (card.innerText || '');

        // Candidate Name
        const nameEl = card.querySelector('[data-cy="candidate-name"], [data-cy="search-result-candidate-name"], a[data-cy*="name"], h3, h4, h5, [class*="candidate-name"], [class*="name"]');
        let name = nameEl ? utils.cleanText(nameEl.innerText || nameEl.textContent) : '';
        name = name.replace(/^[\s\S]*?(?:Candidate|Profile|Name:)?\s*/i, '').trim();
        if (name.includes('\n')) name = name.split('\n')[0].trim();
        if (!name || name.length < 2 || name.toLowerCase().includes('dice') || name.toLowerCase() === 'view profile') return;

        // Title / Designation
        const titleEl = card.querySelector('[data-cy="candidate-title"], [data-cy="search-result-candidate-title"], [class*="title"], [class*="designation"], p[class*="role"]');
        let title = titleEl ? utils.cleanText(titleEl.innerText || titleEl.textContent) : 'Software Professional';
        if (title.toLowerCase() === name.toLowerCase()) {
          const pEls = card.querySelectorAll('p, span');
          for (const p of pEls) {
            const txt = utils.cleanText(p.innerText || p.textContent);
            if (txt && txt !== name && txt.length > 3 && !txt.includes('$') && !txt.includes('Updated')) {
              title = txt;
              break;
            }
          }
        }

        // Contact details (check light DOM and shadowRoot)
        let emailEl = card.querySelector('a[href^="mailto:"]');
        let phoneEl = card.querySelector('a[href^="tel:"]');
        if (card.shadowRoot) {
          if (!emailEl) emailEl = card.shadowRoot.querySelector('a[href^="mailto:"]');
          if (!phoneEl) phoneEl = card.shadowRoot.querySelector('a[href^="tel:"]');
        }
        let email = emailEl ? emailEl.href.replace(/^mailto:/i, '').split('?')[0].trim().toLowerCase() : null;
        let phone = phoneEl ? phoneEl.href.replace(/^tel:/i, '').trim() : null;

        const emails = utils.extractEmails(cardText);
        const phones = utils.extractPhones(cardText);
        if (!email && emails.length > 0) email = emails[0];
        if (!phone && phones.length > 0) phone = phones[0];

        // Location
        const locEl = card.querySelector('[data-cy="candidate-location"], [data-cy="search-result-location"], [class*="location"]');
        let location = locEl ? utils.cleanText(locEl.innerText) : extractLocationFromText(cardText);

        // Experience
        const expEl = card.querySelector('[data-cy="candidate-experience"], [class*="experience"]');
        let experience = expEl ? utils.cleanText(expEl.innerText) : utils.extractExperience(cardText) || '6+ Years';

        // Skills
        const skills = [];
        const skillEls = card.querySelectorAll('[data-cy="candidate-skill"], [data-cy="search-result-skill"], [class*="badge"], [class*="chip"], [class*="skill"], [class*="tag"]');
        skillEls.forEach(el => {
          const s = utils.cleanText(el.innerText);
          if (s && s.length > 1 && s.length < 35 && !skills.includes(s) && !s.includes('Years')) {
            skills.push(s);
          }
        });

        // Work Auth / Visa
        let visaStatus = 'Authorized to Work in US';
        if (/US Citizen|U\.S\. Citizen/i.test(cardText)) visaStatus = 'US Citizen';
        else if (/Green Card|Permanent Resident/i.test(cardText)) visaStatus = 'Green Card';
        else if (/H-?1B/i.test(cardText)) visaStatus = 'H-1B';
        else if (/EAD/i.test(cardText)) visaStatus = 'EAD';

        // Profile URL
        const linkEl = card.querySelector('a[data-cy*="name"], a[href*="/candidates/"], a[href*="/profile/"]') || card.querySelector('a');
        let profileUrl = linkEl ? linkEl.href : window.location.href;

        // Recency
        let updated = 'Active on Dice';
        const updatedMatch = cardText.match(/(?:Updated|Active|Last active)\s+[^·\n\r|]+/i);
        // Check for open candidate drawer or detail pane in Dice
        let diceDetailText = '';
        const diceDrawer = document.querySelector('[data-cy*="candidate-detail"], [class*="candidate-detail"], [class*="profile-drawer"], aside, [role="dialog"]');
        if (diceDrawer && !diceDrawer.closest('#smarthire-copilot-drawer')) {
          diceDetailText = (diceDrawer.innerText || diceDrawer.textContent || '').trim();
        }
        const candidateFullText = (diceDetailText && diceDetailText.length > 120) ? diceDetailText : cardText;

        const candidateObj = {
          id: `dice-${index}-${Date.now().toString().slice(-4)}`,
          name,
          title: title.slice(0, 80),
          email: email || '',
          phone: phone || '',
          location: location || 'United States',
          experience,
          skills: skills.slice(0, 15),
          source: 'Dice',
          visaStatus,
          recency: updated,
          profileUrl,
          notes: `${updated} · Work Auth: ${visaStatus}. Sourced from Dice Talent Search.`,
          resumeText: candidateFullText,
          summary: candidateFullText.slice(0, 5000)
        };

        // Complete Resume Extraction & Verification (Section 4)
        if (window.SmartHireMatchingEngine && typeof window.SmartHireMatchingEngine.verifyAndClassifyResume === 'function') {
          const v = window.SmartHireMatchingEngine.verifyAndClassifyResume(candidateObj);
          candidateObj.extractionStatus = v.status;
          candidateObj.sourceSectionsFound = v.sourceSectionsFound;
          candidateObj.isTruncated = v.isTruncated;
          candidateObj.extractedLength = v.extractedLength;
          candidateObj.missingExpectedSections = v.missingExpectedSections;
          candidateObj.extractionWarnings = v.warnings;
          candidateObj.isProvisional = v.isProvisional;
        } else {
          candidateObj.extractionStatus = candidateFullText.length > 800 ? 'FULL_RESUME_EXTRACTED' : (candidateFullText.length > 250 ? 'PARTIAL_RESUME_EXTRACTED' : 'PROFILE_ONLY');
          candidateObj.extractedLength = candidateFullText.length;
          candidateObj.isProvisional = candidateFullText.length < 800;
        }

        candidates.push(candidateObj);
      } catch (err) {
        console.warn('[SmartHire Copilot] Error parsing Dice candidate card:', err);
      }
    });

    // Helper: Location extractor
    function extractLocationFromText(text) {
      if (!text) return '';
      const locMatch = text.match(/\b([A-Z][a-zA-Z\s.-]+),\s*([A-Z]{2})\b/);
      if (locMatch) {
        return `${locMatch[1].trim()}, ${locMatch[2].trim()}`;
      }
      if (text.toLowerCase().includes('remote')) return 'Remote';
      return '';
    }

    // Deduplicate by name
    const unique = [];
    const seen = new Set();
    for (const c of candidates) {
      const key = c.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(c);
      }
    }

    return unique;
  };

  // 1-Click Search Auto-Fill for Dice
  window.smartHireAutoFillSearch = function(query, location) {
    const utils = window.SmartHireUtils;
    console.log('[SmartHire Copilot] Auto-filling Dice search:', { query, location });

    // 1. Locate Query Input
    const querySelectors = [
      '#typeaheadInput',
      'input[data-cy="search-input"]',
      'input[placeholder*="Title, skill"]',
      'input[placeholder*="Job title, skill"]',
      'input[placeholder*="Search by"]',
      'input[name="q"]',
      '#keywords'
    ];
    let queryInput = null;
    for (const sel of querySelectors) {
      const el = document.querySelector(sel);
      if (el) { queryInput = el; break; }
    }

    // 2. Locate Location Input
    const locSelectors = [
      '#google-location-search',
      'input[data-cy="location-input"]',
      'input[placeholder*="Location"]',
      'input[placeholder*="City, state"]',
      'input[name="location"]',
      '#location'
    ];
    let locInput = null;
    for (const sel of locSelectors) {
      const el = document.querySelector(sel);
      if (el) { locInput = el; break; }
    }

    if (queryInput && query) {
      utils.setNativeValue(queryInput, query);
    }

    if (locInput && location && location !== 'Remote') {
      utils.setNativeValue(locInput, location);
    }

    // 3. Locate Search Button
    const btnSelectors = [
      'button[data-cy="search-button"]',
      'button[type="submit"]',
      '.btn-search',
      'button[class*="search"]',
      'button[class*="submit"]'
    ];
    let searchBtn = null;
    for (const sel of btnSelectors) {
      const el = document.querySelector(sel);
      if (el) { searchBtn = el; break; }
    }

    if (searchBtn) {
      setTimeout(() => {
        searchBtn.click();
      }, 300);
      return 'Injected Boolean query and triggered Dice search!';
    } else if (queryInput) {
      queryInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
      return 'Injected Boolean query and dispatched Enter key!';
    } else {
      const encodedQ = encodeURIComponent(query);
      const encodedL = encodeURIComponent(location || '');
      window.location.href = `https://www.dice.com/employer/talent-search?q=${encodedQ}&location=${encodedL}`;
      return 'Navigating directly to Dice search with query.';
    }
  };
})();
