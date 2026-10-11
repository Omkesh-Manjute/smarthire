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

  // Find all candidate cards on Monster+ (Browserflow selector: smui-card)
  window.getMonsterCards = function() {
    // 1. Direct smui-card tag
    const smuiCards = document.querySelectorAll('smui-card');
    if (smuiCards && smuiCards.length > 0) {
      return Array.from(smuiCards);
    }

    // 2. Class containing smui-card
    const cardsByClass = document.querySelectorAll('[class*="smui-card"]');
    if (cardsByClass && cardsByClass.length > 0) {
      const filtered = Array.from(cardsByClass).filter(el => 
        el.tagName.toLowerCase() === 'smui-card' || 
        (!el.classList.contains('smui-card-body') && !el.classList.contains('smui-card-header') && el.querySelector('.smui-card-body'))
      );
      if (filtered.length > 0) return filtered;
    }

    // 3. Fallback candidate result cards
    const candidates = document.querySelectorAll('[data-testid*="candidate-card"], [data-testid*="candidate-item"], article');
    if (candidates && candidates.length > 0) return Array.from(candidates);

    // 4. Cards with checkboxes or candidate name links
    const nameLinks = document.querySelectorAll('a[href*="/candidate/"], a[href*="/candidates/"]');
    if (nameLinks && nameLinks.length > 0) {
      const cardSet = new Set();
      nameLinks.forEach(a => {
        const c = a.closest('smui-card') || a.closest('article') || a.closest('li') || a.parentElement?.parentElement;
        if (c) cardSet.add(c);
      });
      if (cardSet.size > 0) return Array.from(cardSet);
    }

    return [];
  };

  // Extract contact from #contact-legend-detail or detail panel
  window.extractMonsterContact = function() {
    let phone = '';
    let email = '';

    const contactBox = document.querySelector('#contact-legend-detail, [id*="contact-legend"]');
    if (contactBox) {
      const boxText = contactBox.innerText || '';

      // Direct mailto link
      const mailLink = contactBox.querySelector('a[href^="mailto:"]');
      if (mailLink) {
        email = mailLink.href.replace('mailto:', '').split('?')[0].trim().toLowerCase();
      } else {
        const emailMatch = boxText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch && !emailMatch[1].startsWith('support@') && !emailMatch[1].startsWith('info@')) {
          email = emailMatch[1].trim().toLowerCase();
        }
      }

      // Direct tel link
      const telLink = contactBox.querySelector('a[href^="tel:"]');
      if (telLink) {
        phone = telLink.href.replace('tel:', '').trim();
      } else {
        const phoneMatch = boxText.match(/(?:Phone|Mobile|Cell|Direct)?\s*[:\s]?\s*(\+?1?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4})/i) ||
                           boxText.match(/(\+?1\d{10})/);
        if (phoneMatch) phone = phoneMatch[1].trim();
      }
    }

    // Fallback: search right detail / resume pane
    if (!email || !phone) {
      const detailPanes = document.querySelectorAll('[class*="resume"], [class*="detail"], [class*="profile"], aside');
      for (const p of detailPanes) {
        const txt = p.innerText || '';
        if (txt.includes('@') || txt.includes('Phone:')) {
          if (!email) {
            const em = txt.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            if (em && !em[1].startsWith('support@') && !em[1].startsWith('info@')) {
              email = em[1].trim().toLowerCase();
            }
          }
          if (!phone) {
            const ph = txt.match(/(?:Phone|Mobile|Cell|Direct)?\s*[:\s]?\s*(\+?1?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4})/i) ||
                       txt.match(/(\+?1\d{10})/);
            if (ph) phone = ph[1].trim();
          }
          if (email && phone) break;
        }
      }
    }

    return { phone, email };
  };

  // Deep Scraper: Click each card, reveal details, extract contact info
  window.smartHireScrapeCandidatesAsync = async function(onProgress) {
    const cards = window.getMonsterCards();
    console.log(`[SmartHire Copilot] Found ${cards.length} cards for deep scrape.`);

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

        // Click .smui-card-body (Browserflow exact click)
        const clickTarget = card.querySelector('.smui-card-body') || 
                            card.querySelector('div') || 
                            card;

        clickTarget.scrollIntoView({ behavior: 'auto', block: 'nearest' });
        clickTarget.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        clickTarget.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        clickTarget.click();

        await sleep(500);

        // Click Profile tab if not active
        const profileTab = document.querySelector('li:nth-of-type(2) > .tab__title > .tab__label') ||
                           Array.from(document.querySelectorAll('.tab__label, button, [role="tab"]')).find(t => t.innerText && t.innerText.trim().toLowerCase() === 'profile');
        if (profileTab && !profileTab.closest('.tab--active')) {
          profileTab.click();
          await sleep(250);
        }

        // Candidate Name
        let name = '';
        const detailNameEl = document.querySelector('.candidate-name > div:nth-of-type(1) > span:nth-of-type(1), .candidate-name span, .candidate-name');
        if (detailNameEl && detailNameEl.innerText.trim().length > 1) {
          name = detailNameEl.innerText.replace(/open\s*in\s*new\s*tab/gi, '').replace(/\s+/g, ' ').trim();
        }
        if (!name || name.toLowerCase().includes('open in') || name.length < 2) {
          name = rawName || `Candidate ${i + 1}`;
        }

        if (seenNames.has(name.toLowerCase())) {
          continue;
        }

        // Contact info
        const { phone, email } = window.extractMonsterContact();

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

        seenNames.add(name.toLowerCase());

        const candidateItem = {
          id: `mon-${i}-${Date.now().toString().slice(-4)}`,
          name,
          title: title.slice(0, 80),
          email: email || '',
          phone: phone || '',
          location,
          experience,
          skills: skills.slice(0, 10),
          source: 'Monster+',
          recency,
          profileUrl: window.location.href,
          notes: `${recency} · Sourced via SmartHire Copilot.`
        };

        candidates.push(candidateItem);

        if (typeof onProgress === 'function') {
          const contactStatus = (email || phone) ? `(${email || phone})` : '(No contact disclosed)';
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
        profileUrl: window.location.href
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
