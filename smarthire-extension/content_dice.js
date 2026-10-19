// SmartHire Sourcing Copilot - Dice Content Script
(function() {
  window.smartHirePortal = 'Dice';
  console.log('[SmartHire Copilot] Dice scraper initialized on:', window.location.href);

  const utils = window.SmartHireUtils || {
    cleanText: (t) => (t || '').replace(/\s+/g, ' ').trim(),
    extractEmails: (text) => {
      if (!text) return [];
      const match = text.match(/[a-zA-Z0-9._%+-]+@(mail\.dice\.com|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi) || [];
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

  // Resume-only text sanitizer for Dice: strips portal navigation, buttons, and card noise
  window.cleanDiceResumeText = function(rawText) {
    if (!rawText) return '';
    let text = String(rawText);

    text = text
      .replace(/Dice\s+Talent\s+Search/gi, '')
      .replace(/Quick\s+message/gi, '')
      .replace(/\b(?:View\s+Profile|Contact\s+Candidate|Save\s+Candidate|Send\s+Email|Send\s+Message)\b/gi, '')
      .replace(/\b(?:Add\s+to\s+Project|Download\s+Resume|Print\s+Resume|Skills\s+Matching)\b/gi, '')
      .replace(/\b(?:Back\s+to\s+(?:search\s+results|TalentSearch|candidates?))\b/gi, '')
      .replace(/\b(?:Invite\s+to\s+Apply|Unbiased\s+sourcing\s+(?:on|off))\b/gi, '')
      .replace(/\b(?:Message\s+Email|Candidate\s+Activity|Employer\s+Activity|Profile\s+Source)\b/gi, '')
      .replace(/\b(?:Dice\s+Profile\s+Last\s+Updated|Resume\s+Last\s+Updated|Last\s+Active|Last\s+Viewed)\b/gi, '')
      .replace(/(?:Updated|Active|Last active|Last Viewed)\s+[^·\n\r|]+/gi, '');

    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const cleanLines = lines.filter(line => {
      const lower = line.toLowerCase();
      if (lower.length < 3) return false;
      if (/^(?:back|contact|send|add|export|view|save|actions|next|previous|print|share|download|close|cancel|submit|edit|delete|more|filter|sort|search|login|sign in)$/i.test(lower)) return false;
      if (/^(?:invite to apply|message|email|candidate activity|employer activity|profile source|work preferences|highlights)$/i.test(lower)) return false;
      return true;
    });

    return cleanLines.join('\n');
  };

  // Automated Email Extraction: Checks candidate resume first, mailto links in candidate container, or programmatically clicks [Email] button modal & closes it instantly
  window.extractDiceCandidateEmailAsync = async function(candidateText = '') {
    const utils = window.SmartHireUtils || {};
    
    // 0. Primary check: If candidate resume text is provided or can be extracted, extract candidate's personal email from resume document
    const textToCheck = candidateText || (typeof window.extractCleanDiceResumeText === 'function' ? window.extractCleanDiceResumeText() : '');
    if (textToCheck && typeof utils.extractCandidateEmail === 'function') {
      const emailFromResume = utils.extractCandidateEmail(textToCheck);
      if (emailFromResume && !emailFromResume.includes('coolsofttech') && !emailFromResume.includes('smarthireus')) {
        console.log('[SmartHire Copilot] Captured candidate email from resume document:', emailFromResume);
        return emailFromResume;
      }
    }

    // 1. Direct check: mailto link inside candidate profile container (NEVER scan copilot drawer or nav/header)
    const mailtoLinks = Array.from(document.querySelectorAll('a[href^="mailto:"]')).filter(el => {
      if (el.closest('#smarthire-copilot-drawer') || el.closest('#smarthire-dossier-overlay') || el.closest('header') || el.closest('nav')) return false;
      return true;
    });
    for (const mailto of mailtoLinks) {
      if (mailto && mailto.href) {
        const m = mailto.href.replace(/^mailto:/i, '').split('?')[0].trim().toLowerCase();
        if (m && !m.includes('coolsofttech') && !m.includes('smarthireus') && !m.includes('support@') && !m.includes('info@') && !m.includes('dice.com/')) {
          return m;
        }
      }
    }

    // 2. Direct check: scan candidate container text (NOT entire document.body, to avoid capturing recruiter dock/navbar)
    const candidateContainers = Array.from(document.querySelectorAll(
      '[data-cy*="candidate"], [class*="candidate"], [class*="profile-detail"], main, article'
    )).filter(el => !el.closest('#smarthire-copilot-drawer') && !el.closest('#smarthire-dossier-overlay') && !el.closest('header') && !el.closest('nav'));
    
    for (const container of candidateContainers) {
      const cText = container.innerText || '';
      if (typeof utils.extractCandidateEmail === 'function') {
        const cEmail = utils.extractCandidateEmail(cText);
        if (cEmail && !cEmail.includes('coolsofttech') && !cEmail.includes('smarthireus')) {
          return cEmail;
        }
      }
    }

    // 3. Automated Contact -> Email Modal Clicker
    // On Dice profile pages, Dice hides the relay email until the recruiter clicks the "Email" button in the Contact card.
    const emailButtons = Array.from(document.querySelectorAll('button, a, [role="button"]')).filter(el => {
      if (el.closest('#smarthire-copilot-drawer') || el.closest('#smarthire-dossier-overlay') || el.closest('header') || el.closest('nav')) return false;
      const t = (el.innerText || el.textContent || '').trim().toLowerCase();
      return t === 'email' || t === 'email candidate' || el.getAttribute('data-cy') === 'email-candidate-button';
    });

    if (emailButtons.length > 0) {
      const emailBtn = emailButtons[0];
      try {
        // Trigger modal open
        emailBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        emailBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        emailBtn.click();

        // Poll for the "Email Candidate" modal to mount (up to 1200ms)
        const pollStart = Date.now();
        let capturedEmail = '';
        while (Date.now() - pollStart < 1200) {
          await sleep(100);

          // Find modal container
          const modal = document.querySelector('[role="dialog"], [class*="modal"], [class*="dialog"], [aria-label*="Email"]');
          if (modal && !modal.closest('#smarthire-copilot-drawer') && !modal.closest('#smarthire-dossier-overlay')) {
            const modalText = modal.innerText || modal.textContent || '';
            const modalEmails = (typeof utils.extractCandidateEmail === 'function') 
              ? [utils.extractCandidateEmail(modalText)].filter(Boolean)
              : (utils.extractEmails ? utils.extractEmails(modalText) : []);
            const found = modalEmails.filter(e => !e.includes('coolsofttech') && !e.includes('smarthireus') && !e.startsWith('support@'));
            if (found.length > 0) {
              capturedEmail = found[0];
              break;
            }
          }
        }

        // Close the modal immediately so it does not interrupt the recruiter
        const closeButtons = Array.from(document.querySelectorAll('[role="dialog"] button, [class*="modal"] button')).filter(btn => {
          if (btn.closest('#smarthire-copilot-drawer') || btn.closest('#smarthire-dossier-overlay')) return false;
          const t = (btn.innerText || btn.textContent || '').trim().toLowerCase();
          return t === 'cancel' || t === 'close' || btn.getAttribute('aria-label') === 'Close' || btn.querySelector('svg');
        });
        if (closeButtons.length > 0) {
          closeButtons[0].click();
        } else {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
        }

        if (capturedEmail) {
          console.log('[SmartHire Copilot] Auto-captured Dice candidate email:', capturedEmail);
          return capturedEmail;
        }
      } catch (e) {
        console.warn('[SmartHire Copilot] Error auto-capturing Dice candidate email:', e);
      }
    }

    return '';
  };

  // Dedicated Scraper for a Dice Candidate Profile Page (/employers/talent-search/profile/...)
  window.scrapeDiceProfilePage = async function(onProgress = null) {
    const isProfilePage = window.location.pathname.includes('/profile/') || 
                          window.location.pathname.includes('/candidates/') ||
                          document.querySelector('[class*="profile-header"], [data-cy="candidate-name"]');
    if (!isProfilePage) return null;

    if (typeof onProgress === 'function') onProgress('Extracting candidate profile from Dice...');

    // 1. Candidate Name
    const nameEl = document.querySelector('h1, [data-cy="candidate-name"], [class*="profile-header"] h1, [class*="profile-header"] h2, h2[class*="name"]');
    let name = nameEl ? utils.cleanText(nameEl.innerText || nameEl.textContent) : '';
    name = name.replace(/^[\s\S]*?(?:Candidate|Profile|Name:)?\s*/i, '').trim();
    if (name.includes('\n')) name = name.split('\n')[0].trim();
    if (!name || name.length < 2) return null;

    // 2. Title & Current Company
    const titleEl = document.querySelector('[data-cy="candidate-title"], [class*="profile-header"] p, [class*="profile-title"], [class*="designation"]');
    let title = titleEl ? utils.cleanText(titleEl.innerText || titleEl.textContent) : 'Software Professional';

    // 3. Extract Full Resume & Career Experience Text FIRST
    if (typeof onProgress === 'function') onProgress(`Analyzing resume document for ${name}...`);
    const expSections = Array.from(document.querySelectorAll(
      '[data-cy*="experience"], [data-cy*="work-history"], [class*="experience"], [class*="work-history"], [class*="resume"], section, article'
    )).filter(el => {
      if (el.closest('#smarthire-copilot-drawer') || el.closest('#smarthire-dossier-overlay') || el.closest('header') || el.closest('nav')) return false;
      const t = (el.innerText || '').trim();
      return t.length > 150 && (t.toLowerCase().includes('experience') || t.toLowerCase().includes('education') || t.toLowerCase().includes('skills') || t.toLowerCase().includes('responsibilities'));
    });

    let rawCandidateText = '';
    if (expSections.length > 0) {
      rawCandidateText = expSections.map(s => s.innerText || s.textContent || '').join('\n\n');
    }
    const candidateFullText = window.extractCleanDiceResumeText ? window.extractCleanDiceResumeText() : window.cleanDiceResumeText(rawCandidateText);

    // 4. Candidate-Scoped Contact Extraction (Personal email prioritized from resume document)
    if (typeof onProgress === 'function') onProgress(`Extracting verified contact details for ${name}...`);
    let email = (window.SmartHireUtils && typeof window.SmartHireUtils.extractCandidateEmail === 'function')
      ? window.SmartHireUtils.extractCandidateEmail(candidateFullText)
      : '';
    if (!email || email.includes('coolsofttech') || email.includes('smarthireus')) {
      email = await window.extractDiceCandidateEmailAsync(candidateFullText);
    }

    // Phone: from resume text first, then candidate DOM
    let phone = (window.SmartHireUtils && typeof window.SmartHireUtils.extractCandidatePhone === 'function')
      ? window.SmartHireUtils.extractCandidatePhone(candidateFullText)
      : '';
    if (!phone) {
      const phoneEl = Array.from(document.querySelectorAll('a[href^="tel:"]')).find(el => !el.closest('#smarthire-copilot-drawer') && !el.closest('#smarthire-dossier-overlay'));
      phone = phoneEl ? phoneEl.href.replace(/^tel:/i, '').trim() : '';
    }
    if (!phone && rawCandidateText) {
      const phones = utils.extractPhones(rawCandidateText);
      if (phones.length > 0) phone = phones[0];
    }

    // 5. Highlights: Location, Experience, Work Authorization
    let location = '';
    const locEl = document.querySelector('[data-cy*="location"], [class*="location"]');
    if (locEl && !locEl.closest('#smarthire-copilot-drawer') && !locEl.closest('#smarthire-dossier-overlay')) {
      location = (window.SmartHireUtils && typeof window.SmartHireUtils.extractLocation === 'function')
        ? window.SmartHireUtils.extractLocation(locEl.innerText || '')
        : utils.cleanText(locEl.innerText || '');
    }
    if (!location || location === 'United States') {
      location = (window.SmartHireUtils && typeof window.SmartHireUtils.extractLocation === 'function')
        ? window.SmartHireUtils.extractLocation(candidateFullText.slice(0, 2500))
        : '';
    }
    if (!location || location === 'United States') {
      const locMatch = rawCandidateText.match(/Location\s*[\n\r:]*\s*([A-Za-z\s.-]+,\s*[A-Za-z]{2,})/i) ||
                       rawCandidateText.match(/\b([A-Z][a-zA-Z\s.-]+),\s*([A-Z]{2})\b/);
      if (locMatch && !locMatch[0].includes('Select a Card') && !locMatch[0].includes('Open In')) {
        location = locMatch[1].trim();
      }
    }
    if (!location) location = 'United States';

    // Experience
    let experience = '5+ Years';
    const expMatch = candidateFullText.match(/Years of experience\s*[\n\r:]*\s*(\d+\+?\s*(?:years?|yrs?))/i) ||
                     candidateFullText.match(/(\d+\+?\s*(?:years?|yrs?)(?:\s*of\s*experience)?)/i);
    if (expMatch) experience = expMatch[1].trim();

    // Work Auth
    let visaStatus = 'Authorized to Work in US';
    const authMatch = candidateFullText.match(/Work Authorization\s*[\n\r:]*\s*([A-Za-z\s]+)/i);
    if (authMatch) {
      visaStatus = authMatch[1].trim();
    } else if (/US Citizen|U\.S\. Citizen/i.test(candidateFullText)) {
      visaStatus = 'US Citizen';
    } else if (/Green Card|Permanent Resident/i.test(candidateFullText)) {
      visaStatus = 'Green Card';
    } else if (/Canadian Citizen/i.test(candidateFullText)) {
      visaStatus = 'Canadian Citizen';
    } else if (/H-?1B/i.test(candidateFullText)) {
      visaStatus = 'H-1B';
    }

    // 6. Skills
    const skills = [];
    const skillEls = document.querySelectorAll('[data-cy*="skill"], [class*="skill"], [class*="badge"], [class*="chip"], [class*="tag"]');
    skillEls.forEach(el => {
      if (el.closest('#smarthire-copilot-drawer') || el.closest('#smarthire-dossier-overlay') || el.closest('header') || el.closest('nav')) return;
      let s = utils.cleanText(el.innerText || el.textContent);
      // Strip year counts like "Agile 8 yrs 2025" -> "Agile"
      s = s.replace(/\s*\d+\s*(?:yrs?|years?).*$/i, '').trim();
      if (s && s.length > 1 && s.length < 35 && !skills.includes(s) && !s.toLowerCase().includes('view all') && !s.toLowerCase().includes('skills')) {
        skills.push(s);
      }
    });

    const candidateObj = {
      id: `dice-prof-${Date.now().toString().slice(-4)}`,
      name,
      title: title.slice(0, 80),
      email: email || '',
      phone: phone || '',
      location,
      experience,
      skills: skills.slice(0, 20),
      source: 'Dice',
      visaStatus,
      recency: 'Active on Dice',
      profileUrl: window.location.href,
      notes: `Work Auth: ${visaStatus}. Sourced from Dice Talent Search Profile.`,
      resumeText: candidateFullText,
      summary: candidateFullText.slice(0, 5000),
      resumeSourceType: candidateFullText.length >= 800 ? 'RESUME_DOCUMENT' : 'PROFILE_SNIPPET'
    };

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
      candidateObj.extractionStatus = candidateFullText.length > 800 ? 'FULL_RESUME_EXTRACTED' : 'PARTIAL_RESUME_EXTRACTED';
      candidateObj.extractedLength = candidateFullText.length;
      candidateObj.isProvisional = candidateFullText.length < 800;
    }

    return candidateObj;
  };

  // Main scraper function for Dice (handles Search Results page AND Individual Profile page)
  window.smartHireScrapeCandidates = async function(onProgress = null) {
    // 1. If on an individual candidate profile page (/employers/talent-search/profile/...)
    if (window.location.pathname.includes('/profile/') || window.location.pathname.includes('/candidates/')) {
      const singleCand = await window.scrapeDiceProfilePage(onProgress);
      if (singleCand) {
        if (typeof onProgress === 'function') onProgress(`✓ Extracted ${singleCand.name} successfully!`);
        return [singleCand];
      }
    }

    // 2. Search Results Page: Scrape all candidate cards in search results list
    const candidates = [];

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
      '[class*="card-container"]',
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
      const links = document.querySelectorAll('a[href*="/profile/"], a[href*="/candidates/"], a[href*="/talent/"], a[data-cy*="candidate"]');
      const parents = new Set();
      links.forEach(link => {
        let parent = link.closest('article') || link.closest('dhi-search-card') || link.closest('div[class*="card"]') || link.parentElement?.parentElement?.parentElement;
        if (parent && !parents.has(parent) && !parent.closest('#smarthire-copilot-drawer')) {
          parents.add(parent);
          cardElements.push(parent);
        }
      });
    }

    console.log(`[SmartHire Copilot] Found ${cardElements.length} candidate cards on Dice search results`);

    for (let index = 0; index < cardElements.length; index++) {
      const card = cardElements[index];
      try {
        const cardText = card.innerText || '';

        // Candidate Name
        const nameEl = card.querySelector('[data-cy="candidate-name"], [data-cy="search-result-candidate-name"], a[href*="/profile/"], a[data-cy*="name"], h3, h4, h5, [class*="candidate-name"], [class*="name"]');
        let name = nameEl ? utils.cleanText(nameEl.innerText || nameEl.textContent) : '';
        name = name.replace(/^[\s\S]*?(?:Candidate|Profile|Name:)?\s*/i, '').trim();
        if (name.includes('\n')) name = name.split('\n')[0].trim();
        if (!name || name.length < 2 || name.toLowerCase().includes('dice') || name.toLowerCase() === 'view profile') continue;

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

        // Contact details
        let emailEl = card.querySelector('a[href^="mailto:"]');
        let phoneEl = card.querySelector('a[href^="tel:"]');
        let email = emailEl ? emailEl.href.replace(/^mailto:/i, '').split('?')[0].trim().toLowerCase() : null;
        if (email && (email.includes('coolsofttech') || email.includes('smarthireus') || email.includes('dice.com/'))) {
          email = null;
        }
        let phone = phoneEl ? phoneEl.href.replace(/^tel:/i, '').trim() : null;

        if (!email && window.SmartHireUtils && typeof window.SmartHireUtils.extractCandidateEmail === 'function') {
          email = window.SmartHireUtils.extractCandidateEmail(cardText);
        } else if (!email) {
          const emails = utils.extractEmails(cardText).filter(e => !e.includes('coolsofttech') && !e.includes('smarthireus'));
          if (emails.length > 0) email = emails[0];
        }

        if (!phone && window.SmartHireUtils && typeof window.SmartHireUtils.extractCandidatePhone === 'function') {
          phone = window.SmartHireUtils.extractCandidatePhone(cardText);
        } else if (!phone) {
          const phones = utils.extractPhones(cardText);
          if (phones.length > 0) phone = phones[0];
        }

        // Location
        const locEl = card.querySelector('[data-cy="candidate-location"], [data-cy="search-result-location"], [class*="location"]');
        let location = '';
        if (locEl) {
          location = (window.SmartHireUtils && typeof window.SmartHireUtils.extractLocation === 'function')
            ? window.SmartHireUtils.extractLocation(locEl.innerText || '')
            : utils.cleanText(locEl.innerText || '');
        }
        if (!location || location === 'United States') {
          location = (window.SmartHireUtils && typeof window.SmartHireUtils.extractLocation === 'function')
            ? window.SmartHireUtils.extractLocation(cardText)
            : extractLocationFromText(cardText);
        }

        // Experience
        const expEl = card.querySelector('[data-cy="candidate-experience"], [class*="experience"]');
        let experience = expEl ? utils.cleanText(expEl.innerText) : utils.extractExperience(cardText) || '6+ Years';

        // Skills
        const skills = [];
        const skillEls = card.querySelectorAll('[data-cy="candidate-skill"], [data-cy="search-result-skill"], [class*="badge"], [class*="chip"], [class*="skill"], [class*="tag"]');
        skillEls.forEach(el => {
          let s = utils.cleanText(el.innerText);
          s = s.replace(/\s*\d+\s*(?:yrs?|years?).*$/i, '').trim();
          if (s && s.length > 1 && s.length < 35 && !skills.includes(s) && !s.includes('Years')) {
            skills.push(s);
          }
        });

        // Work Auth / Visa
        let visaStatus = 'Authorized to Work in US';
        if (/US Citizen|U\.S\. Citizen/i.test(cardText)) visaStatus = 'US Citizen';
        else if (/Green Card|Permanent Resident/i.test(cardText)) visaStatus = 'Green Card';
        else if (/Canadian Citizen/i.test(cardText)) visaStatus = 'Canadian Citizen';
        else if (/H-?1B/i.test(cardText)) visaStatus = 'H-1B';
        else if (/EAD/i.test(cardText)) visaStatus = 'EAD';

        // Profile URL
        const linkEl = card.querySelector('a[href*="/profile/"], a[data-cy*="name"]') || card.querySelector('a');
        let profileUrl = linkEl ? linkEl.href : window.location.href;

        let updated = 'Active on Dice';
        const candidateFullText = window.cleanDiceResumeText(cardText);

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
          summary: candidateFullText.slice(0, 5000),
          resumeSourceType: 'SEARCH_CARD_SNIPPET'
        };

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
          candidateObj.extractionStatus = 'PARTIAL_RESUME_EXTRACTED';
          candidateObj.extractedLength = candidateFullText.length;
          candidateObj.isProvisional = true;
        }

        candidates.push(candidateObj);

        if (typeof onProgress === 'function') {
          onProgress(`Extracted ${candidates.length} of ${cardElements.length}: ${name}`);
        }
      } catch (err) {
        console.warn('[SmartHire Copilot] Error parsing Dice candidate card:', err);
      }
    }

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

  window.smartHireScrapeCandidatesAsync = window.smartHireScrapeCandidates;

  // Extract clean text from open Dice candidate viewer or profile page
  window.extractCleanDiceResumeText = function() {
    const diceDrawer = document.querySelector('[data-cy*="candidate-detail"], [class*="candidate-detail"], [class*="profile-drawer"], aside, [role="dialog"]');
    if (diceDrawer && !diceDrawer.closest('#smarthire-copilot-drawer') && !diceDrawer.closest('#smarthire-dossier-overlay')) {
      const t = (diceDrawer.innerText || diceDrawer.textContent || '').trim();
      if (t.length > 250) {
        return window.cleanDiceResumeText(t);
      }
    }

    // Scrape candidate resume viewer / text layer if present (PDF/HTML viewer)
    const viewerContainers = Array.from(document.querySelectorAll(
      'dhi-candidate-resume-viewer, [data-cy*="resume-viewer"], [class*="resume-viewer"], [class*="textLayer"], .pdf-viewer, #resume-viewer'
    )).filter(el => !el.closest('#smarthire-copilot-drawer') && !el.closest('#smarthire-dossier-overlay'));
    if (viewerContainers.length > 0) {
      const combined = viewerContainers.map(c => c.innerText || c.textContent || '').join('\n\n');
      if (combined.length > 200) {
        return window.cleanDiceResumeText(combined);
      }
    }

    const resumeContainers = Array.from(document.querySelectorAll(
      '[data-cy*="experience"], [data-cy*="work-history"], [class*="experience"], [class*="work-history"], [class*="resume"], section, main, article'
    )).filter(el => {
      if (el.closest('#smarthire-copilot-drawer') || el.closest('#smarthire-dossier-overlay') || el.closest('header') || el.closest('nav')) return false;
      const t = (el.innerText || '').trim();
      return t.length > 250 && (t.toLowerCase().includes('experience') || t.toLowerCase().includes('education') || t.toLowerCase().includes('skills'));
    });

    if (resumeContainers.length > 0) {
      const combined = resumeContainers.map(c => c.innerText || c.textContent || '').join('\n\n');
      if (combined.length > 300) {
        return window.cleanDiceResumeText(combined);
      }
    }

    // Filtered page text (excluding copilot drawer and header/nav)
    if (document.body) {
      const clone = document.body.cloneNode(true);
      if (clone) {
        const drawer = clone.querySelector('#smarthire-copilot-drawer');
        if (drawer) drawer.remove();
        const dossier = clone.querySelector('#smarthire-dossier-overlay');
        if (dossier) dossier.remove();
        const nav = clone.querySelectorAll('header, nav, footer');
        nav.forEach(n => n.remove());
        return window.cleanDiceResumeText(clone.innerText || '');
      }
    }

    return window.cleanDiceResumeText(document.body ? document.body.innerText || '' : '');
  };

  // 1-Click Search Auto-Fill for Dice
  window.smartHireAutoFillSearch = function(param1, param2) {
    const utils = window.SmartHireUtils;
    let query = '';
    let location = '';

    if (param1 && typeof param1 === 'object') {
      let rawTitle = param1.title || '';
      let cleanTitle = rawTitle;
      if (window.SmartHireMatchingEngine && typeof window.SmartHireMatchingEngine.cleanJobTitleForSearch === 'function') {
        cleanTitle = window.SmartHireMatchingEngine.cleanJobTitleForSearch(rawTitle);
      }
      query = param1.skillsQuery || param1.query || cleanTitle || '';
      location = param1.location || '';
    } else {
      query = param1 || '';
      location = param2 || '';
    }

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
