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
      // Block known system/junk senders — candidate relay emails like @contact.monster.com are KEPT!
      const ignoreExactDomains = [
        '@monster.com', '@info.monster.com', '@reply.monster.com', '@noreply.monster.com',
        '@bounce.monster.com', '@email.monster.com',
        '@dice.com', '@noreply.dice.com',
        '@sentry.io', '@google.com', '@cloudflare.com', '@w3.org', '@example.com'
      ];
      let m;
      while ((m = emailRegex.exec(text)) !== null) {
        const email = m[0].trim().toLowerCase();
        if (email.endsWith('.png') || email.endsWith('.jpg') || email.endsWith('.svg') || email.endsWith('.js')) continue;
        if (!ignoreExactDomains.some(d => email.endsWith(d)) && !matches.includes(email)) {
          matches.push(email);
        }
      }
      return matches;
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
