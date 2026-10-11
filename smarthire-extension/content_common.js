// SmartHire Sourcing Copilot - Common Scraping Utilities
(function() {
  if (window.__smartHireCommonLoaded) return;
  window.__smartHireCommonLoaded = true;

  // Global extraction helpers
  window.SmartHireUtils = {
    // Phone regex matcher
    extractPhones(text) {
      if (!text) return [];
      const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
      const matches = [];
      let m;
      while ((m = phoneRegex.exec(text)) !== null) {
        const cleaned = `(${m[1]}) ${m[2]}-${m[3]}`;
        if (!matches.includes(cleaned)) matches.push(cleaned);
      }
      return matches;
    },

    // Email regex matcher
    extractEmails(text) {
      if (!text) return [];
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const matches = [];
      const ignoreDomains = ['monster.com', 'dice.com', 'sentry.io', 'google.com', 'cloudflare.com', 'w3.org', 'example.com'];
      let m;
      while ((m = emailRegex.exec(text)) !== null) {
        const email = m[0].trim().toLowerCase();
        const domain = email.split('@')[1];
        if (!ignoreDomains.some(d => domain.includes(d)) && !matches.includes(email)) {
          matches.push(email);
        }
      }
      return matches;
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
