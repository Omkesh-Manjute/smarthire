// SmartHire Sourcing Copilot - Monster+ Content Script (Browserflow Precision Scraper & Auto-Fill)
(function() {
  window.smartHirePortal = 'Monster+';
  console.log('[SmartHire Copilot v3.5] Monster+ scraper active on:', window.location.href);

  const utils = window.SmartHireUtils || {
    extractEmails: (text) => {
      if (!text) return [];
      const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      return Array.from(new Set(match.map(e => e.toLowerCase()).filter(e => !e.includes('monster.com'))));
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
      .replace(/Viewed/gi, '')
      .replace(/Updated\s*[:\s]*[^\n\r·]+/gi, '')
      .replace(/Current:\s*[^\n\r]+/gi, '')
      .replace(/Previous:\s*[^\n\r]+/gi, '')
      .replace(/Top\s*Skills:\s*[^\n\r]+/gi, '')
      .trim();

    const lines = str.split('\n').map(l => l.trim()).filter(Boolean);
    const candidateLine = lines[0] || '';
    return candidateLine.replace(/open\s*in\s*new\s*tab/gi, '').replace(/·/g, '').replace(/\s+/g, ' ').trim();
  };

  // Find all candidate cards on Monster+ (Browserflow selector: smui-card)
  function getMonsterCards() {
    // 1. Browserflow selector: smui-card
    const smuiCards = document.querySelectorAll('smui-card');
    if (smuiCards && smuiCards.length > 0) {
      return Array.from(smuiCards);
    }

    // 2. Class containing smui-card (excluding internal sub-containers)
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
  }

  // Extract contact from #contact-legend-detail (Browserflow exact selector!)
  function extractContactFromLegend() {
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
        if (emailMatch && !emailMatch[1].includes('monster.com')) {
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

    // Fallback: search right detail / resume pane if contact box was empty
    if (!email || !phone) {
      const detailPanes = document.querySelectorAll('[class*="resume"], [class*="detail"], [class*="profile"], aside');
      for (const p of detailPanes) {
        const txt = p.innerText || '';
        if (txt.includes('@') || txt.includes('Phone:')) {
          if (!email) {
            const em = txt.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            if (em && !em[1].includes('monster.com')) email = em[1].trim().toLowerCase();
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
  }

  // Extract clean Candidate Name using Browserflow selector or card fallback
  function extractCandidateName(card) {
    // 1. Browserflow exact selector in detail pane: .candidate-name > div:nth-of-type(1) > span:nth-of-type(1)
    const detailNameEl = document.querySelector('.candidate-name > div:nth-of-type(1) > span:nth-of-type(1), .candidate-name span, .candidate-name');
    if (detailNameEl && detailNameEl.innerText.trim().length > 1) {
      const clean = detailNameEl.innerText.replace(/open\s*in\s*new\s*tab/gi, '').replace(/\s+/g, ' ').trim();
      if (clean && !clean.toLowerCase().includes('open in') && clean.length > 1) {
        return clean;
      }
    }

    // 2. From candidate card
    const cardNameEl = card.querySelector('a[href*="/candidate/"], h2, h3, h4, [class*="name"]') || card;
    return window.extractCleanMonsterName(cardNameEl.innerText || card.innerText || '');
  }

  // Deep Scraper: Click each card, reveal #contact-legend-detail, extract phone & email
  window.smartHireScrapeCandidatesAsync = async function(onProgress) {
    const cards = getMonsterCards();
    console.log(`[SmartHire Copilot] Found ${cards.length} cards for deep extraction.`);

    if (cards.length === 0) {
      if (typeof onProgress === 'function') {
        onProgress('No candidate cards found on this page. Make sure search results are visible.');
      }
      return [];
    }

    const candidates = [];
    const seenNames = new Set();

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      try {
        const cardText = card.innerText || '';

        // Extract name before clicking
        let rawName = window.extractCleanMonsterName(cardText);

        if (typeof onProgress === 'function') {
          onProgress(`Processing candidate ${i + 1} of ${cards.length} (${rawName || 'Candidate'})...`);
        }

        // BROWSERFLOW CLICK: Click .smui-card-body to open candidate details in right pane
        const clickTarget = card.querySelector('.smui-card-body') || 
                            card.querySelector('div') || 
                            card;

        clickTarget.scrollIntoView({ behavior: 'auto', block: 'nearest' });
        clickTarget.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        clickTarget.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        clickTarget.click();

        // Allow Monster 450ms to render #contact-legend-detail in the right pane
        await sleep(450);

        // Check if Profile tab needs to be clicked (Browserflow step 4)
        const profileTab = document.querySelector('li:nth-of-type(2) > .tab__title > .tab__label') ||
                           Array.from(document.querySelectorAll('.tab__label, button, [role="tab"]')).find(t => t.innerText && t.innerText.trim().toLowerCase() === 'profile');
        if (profileTab && !profileTab.closest('.tab--active')) {
          profileTab.click();
          await sleep(250);
        }

        // Extract Candidate Name from detail pane (.candidate-name) or card
        const name = extractCandidateName(card) || rawName || `Candidate ${i + 1}`;
        if (seenNames.has(name.toLowerCase())) {
          continue;
        }

        // Extract Contact Phone & Email from #contact-legend-detail!
        const { phone, email } = extractContactFromLegend();

        // Extract Title from card text
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
            !cleanLine.includes('Viewed')
          ) {
            title = cleanLine;
            break;
          }
        }

        // Extract Location from card text
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

        // Skills from card
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
          notes: `${recency} · Extracted via SmartHire Copilot.`
        };

        candidates.push(candidateItem);

        if (typeof onProgress === 'function') {
          const contactStatus = (email || phone) ? `(Contact: ${email || phone})` : '(No contact disclosed)';
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

  // Synchronous quick fallback
  window.smartHireScrapeCandidates = function() {
    const cards = getMonsterCards();
    const candidates = [];
    const contact = extractContactFromLegend();

    cards.forEach((card, i) => {
      const cardText = card.innerText || '';
      const name = extractCandidateName(card) || `Candidate ${i + 1}`;
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

  // Auto-Fill Search for Monster+ (Dashboard & Search Results Sidebar)
  window.smartHireAutoFillSearch = function({ title, skillsQuery, query, location }) {
    console.log('[SmartHire Copilot] Auto-filling Monster+ search with:', { title, skillsQuery, query, location });
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

    // 1. Fill Job Title
    const titleInp = findInput(['cook, developer, nurse', 'job title', 'jobtitle', 'title']);
    if (titleInp && cleanTitle) {
      utils.setNativeValue(titleInp, cleanTitle);
    }

    // 2. Fill Skills / Keywords
    const skillsInp = findInput(['javascript, management, finance', 'skills / keywords', 'skills/keywords', 'boolean', 'skills', 'keyword']);
    if (skillsInp && cleanSkills) {
      utils.setNativeValue(skillsInp, cleanSkills);
    }

    // 3. Fill Location
    const locInp = findInput(['city, state, or zip', 'city, state', 'location', 'zip']);
    if (locInp && cleanLoc) {
      utils.setNativeValue(locInp, cleanLoc);
    }

    // 4. Click UPDATE button (Search Results page)
    const allButtons = Array.from(document.querySelectorAll('button'));
    const updateBtn = allButtons.find(b => {
      const txt = (b.innerText || '').trim().toUpperCase();
      return txt === 'UPDATE' || txt.includes('UPDATE SEARCH');
    });

    if (updateBtn) {
      setTimeout(() => { updateBtn.click(); }, 300);
      return `Filled Title, Skills, and Location, and clicked UPDATE!`;
    }

    // 5. Click Find Candidates button (Dashboard page)
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
