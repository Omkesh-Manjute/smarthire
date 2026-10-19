// SmartHire Sourcing Copilot - Common Scraping Utilities
(function() {
  if (window.__smartHireCommonLoaded) return;
  window.__smartHireCommonLoaded = true;

  // Global extraction helpers
  window.SmartHireUtils = {
    // Deep Query Selector - traverses light DOM and all open shadow roots
    queryDeep(selector, root = document) {
      if (!root) return null;
      try {
        const found = root.querySelector(selector);
        if (found) return found;
      } catch (e) {}

      const allElements = root.querySelectorAll ? root.querySelectorAll('*') : [];
      for (const el of allElements) {
        if (el.shadowRoot) {
          const res = this.queryDeep(selector, el.shadowRoot);
          if (res) return res;
        }
      }
      return null;
    },

    // Deep Query All - collects matching elements across light DOM and shadow roots
    queryDeepAll(selector, root = document) {
      const results = [];
      if (!root) return results;
      try {
        const found = root.querySelectorAll(selector);
        if (found && found.length > 0) results.push(...Array.from(found));
      } catch (e) {}

      const allElements = root.querySelectorAll ? root.querySelectorAll('*') : [];
      for (const el of allElements) {
        if (el.shadowRoot) {
          results.push(...this.queryDeepAll(selector, el.shadowRoot));
        }
      }
      return results;
    },

    // Get all text content including shadow roots
    getTextDeep(root = document.body) {
      if (!root) return '';
      let text = (root.innerText || root.textContent || '') + '\n';
      const allElements = root.querySelectorAll ? root.querySelectorAll('*') : [];
      for (const el of allElements) {
        if (el.shadowRoot) {
          text += this.getTextDeep(el.shadowRoot) + '\n';
        }
      }
      return text;
    },

    // Robust phone regex matcher supporting standard US/international formats
    extractPhones(text) {
      if (!text) return [];
      const matches = [];
      // Handles (123) 456-7890, 123-456-7890, 123.456.7890, +1 123 456 7890, 1234567890
      const phoneRegex = /(?:\+?1[-.\s]?)?(?:\(?([2-9]\d{2})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4}))\b/g;
      let m;
      while ((m = phoneRegex.exec(text)) !== null) {
        const cleaned = `(${m[1]}) ${m[2]}-${m[3]}`;
        // Skip dummy 555-0100 to 555-0199 test numbers and duplicates
        if (!cleaned.includes('555-01') && !matches.includes(cleaned)) {
          matches.push(cleaned);
        }
      }
      return matches;
    },

    // Robust email regex matcher
    extractEmails(text) {
      if (!text) return [];
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const matches = [];
      const ignoreExactDomains = [
        '@monster.com', '@info.monster.com', '@reply.monster.com', '@noreply.monster.com',
        '@bounce.monster.com', '@email.monster.com',
        '@dice.com', '@noreply.dice.com',
        '@coolsofttech.com', '@coolsoft.com', '@smarthireus.com',
        '@sentry.io', '@google.com', '@cloudflare.com', '@w3.org', '@example.com'
      ];
      let m;
      while ((m = emailRegex.exec(text)) !== null) {
        const email = m[0].trim().toLowerCase();
        if (email.endsWith('.png') || email.endsWith('.jpg') || email.endsWith('.svg') || email.endsWith('.js')) continue;
        if (email.includes('coolsofttech') || email.includes('smarthireus')) continue;
        if (email.startsWith('support@') || email.startsWith('info@') || email.startsWith('sales@') ||
            email.startsWith('careers@') || email.startsWith('jobs@') || email.startsWith('privacy@') ||
            email.startsWith('help@') || email.startsWith('donotreply@') || email.startsWith('noreply@') ||
            email.startsWith('service@') || email.startsWith('admin@')) {
          continue;
        }
        if (!ignoreExactDomains.some(d => email.endsWith(d)) && !matches.includes(email)) {
          matches.push(email);
        }
      }
      return matches;
    },

    // Extract personal candidate email from authentic resume or text, strictly excluding recruiter/system domains
    extractCandidateEmail(text) {
      if (!text || text.length < 8) return '';
      const headerSlice = text.slice(0, 3000);
      let fEmails = this.extractEmails(headerSlice);
      if (!fEmails || fEmails.length === 0) {
        fEmails = this.extractEmails(text);
      }
      if (!fEmails || fEmails.length === 0) return '';

      // Strict blacklisting of recruiter/corporate domains
      const clean = fEmails.filter(e => {
        const l = e.toLowerCase();
        if (l.includes('coolsofttech') || l.includes('coolsoft') || l.includes('smarthireus')) return false;
        if (l.includes('monster.com') && !l.endsWith('@contact.monster.com')) return false;
        if (l.includes('dice.com') && !l.endsWith('@mail.dice.com')) return false;
        return true;
      });

      if (clean.length === 0) return '';

      // Prefer consumer domains or candidate relay emails
      const preferred = clean.find(e => {
        const l = e.toLowerCase();
        return l.endsWith('@gmail.com') || l.endsWith('@yahoo.com') || l.endsWith('@hotmail.com') ||
               l.endsWith('@outlook.com') || l.endsWith('@icloud.com') || l.endsWith('@aol.com') ||
               l.endsWith('@contact.monster.com') || l.endsWith('@mail.dice.com');
      });

      return preferred || clean[0];
    },

    // Extract candidate phone from authentic resume or text
    extractCandidatePhone(text) {
      if (!text || text.length < 8) return '';
      const headerSlice = text.slice(0, 3000);
      let fPhones = this.extractPhones(headerSlice);
      if (!fPhones || fPhones.length === 0) {
        fPhones = this.extractPhones(text);
      }
      return (fPhones && fPhones.length > 0) ? fPhones[0] : '';
    },

    // Extract City, State or Location cleanly from candidate text/card, avoiding system noise
    extractLocation(text) {
      if (!text) return '';
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
        
        // Match City, State or City, State ZIP on a single line
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
    },

    // CSP-safe clipboard copy with automatic fallback
    async safeCopyToClipboard(text) {
      if (!text) return false;
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } catch (err) {
        console.warn('[SmartHire Copilot] navigator.clipboard blocked by CSP, using textarea fallback:', err);
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
      } catch (err) {
        console.error('[SmartHire Copilot] execCommand copy failed:', err);
        return false;
      }
    },

    // Experience extractor
    extractExperience(text) {
      if (!text) return null;
      const match = text.match(/(\d{1,2}(?:\.\d)?)\s*(?:\+)?\s*(?:years?|yrs?|yr)\b/i);
      if (match) {
        return `${match[1]}+ Years`;
      }
      return null;
    },

    // Clean text helper
    cleanText(str) {
      if (!str) return '';
      return str.replace(/\s+/g, ' ').replace(/[\n\r\t]/g, ' ').trim();
    },

    // Synthetic typing simulator for modern React/Vue inputs
    setNativeValue(element, value) {
      const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
      const prototype = Object.getPrototypeOf(element);
      const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      
      if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(element, value);
      } else if (valueSetter) {
        valueSetter.call(element, value);
      } else {
        element.value = value;
      }
      
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  // Message listener for requests from popup or background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'PING') {
      sendResponse({
        status: 'ok',
        portal: window.smartHirePortal || (window.location.hostname.includes('monster.com') ? 'Monster+' : (window.location.hostname.includes('dice.com') ? 'Dice' : 'Web')),
        url: window.location.href,
        title: document.title
      });
      return true;
    }

    if (request.action === 'SCRAPE_PAGE') {
      (async () => {
        try {
          let candidates = [];
          const onProgress = (msg) => {
            try {
              chrome.runtime.sendMessage({ action: 'SCRAPE_PROGRESS', message: msg });
            } catch (e) {}
          };

          if (typeof window.smartHireScrapeCandidatesAsync === 'function') {
            candidates = await window.smartHireScrapeCandidatesAsync(onProgress);
          } else if (typeof window.smartHireScrapeCandidates === 'function') {
            candidates = window.smartHireScrapeCandidates();
          } else {
            const generic = window.genericFallbackScrape ? window.genericFallbackScrape() : [];
            candidates = generic;
          }
          sendResponse({ success: true, candidates, count: candidates.length, portal: window.smartHirePortal });
        } catch (err) {
          console.error('[SmartHire Copilot] Scrape error:', err);
          sendResponse({ success: false, error: err.message, candidates: [] });
        }
      })();
      return true; // Keep channel open for async response
    }

    if (request.action === 'AUTO_FILL_SEARCH') {
      try {
        if (typeof window.smartHireAutoFillSearch === 'function') {
          const res = window.smartHireAutoFillSearch({
            title: request.title,
            skillsQuery: request.skillsQuery,
            query: request.query,
            location: request.location
          });
          sendResponse({ success: true, message: res });
        } else {
          sendResponse({ success: false, error: 'Auto-fill handler not loaded on this page.' });
        }
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }
  });

  // Generic fallback page scraper
  window.genericFallbackScrape = function() {
    const list = [];
    const text = document.body.innerText || '';
    const emails = window.SmartHireUtils.extractEmails(text);
    const phones = window.SmartHireUtils.extractPhones(text);

    // If emails found, synthesize candidate entries
    emails.forEach((email, i) => {
      const namePart = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      list.push({
        id: `gen-${i}-${Date.now().toString().slice(-4)}`,
        name: namePart,
        email: email,
        phone: phones[i] || '',
        title: 'Candidate Profile',
        location: '',
        skills: [],
        experience: '5+ Years',
        source: 'Web Scraped',
        profileUrl: window.location.href
      });
    });
    return list;
  };
})();
