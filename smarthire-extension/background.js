// SmartHire Sourcing Copilot - Service Worker (Background)
chrome.runtime.onInstalled.addListener(() => {
  console.log('[SmartHire Copilot] Extension installed and active.');
  chrome.storage.local.get(['smarthire_api_url'], (result) => {
    if (!result.smarthire_api_url) {
      chrome.storage.local.set({ smarthire_api_url: 'https://smarthireus.com' });
    }
  });
});

// Relay messages between popup and active tabs
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'OPEN_TAB') {
    chrome.tabs.create({ url: request.url }, (tab) => {
      sendResponse({ success: true, tabId: tab.id });
    });
    return true;
  }

  if (request.action === 'GET_ACTIVE_TAB_INFO') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        const tab = tabs[0];
        const isMonster = tab.url && (tab.url.includes('monster.com'));
        const isDice = tab.url && (tab.url.includes('dice.com'));
        sendResponse({
          success: true,
          tabId: tab.id,
          url: tab.url,
          title: tab.title,
          isMonster,
          isDice,
          portal: isMonster ? 'Monster+' : (isDice ? 'Dice' : 'Other')
        });
      } else {
        sendResponse({ success: false, error: 'No active tab found' });
      }
    });
    return true;
  }

  // Bypass page CSP by executing ATS API calls from background service worker
  if (request.action === 'FETCH_JOBS') {
    fetch('https://smarthireus.com/api/jobs')
      .then(res => res.json())
      .then(data => {
        const jobsList = Array.isArray(data) ? data : (Array.isArray(data?.jobs) ? data.jobs : []);
        sendResponse({ success: true, jobs: jobsList, total: jobsList.length });
      })
      .catch(err => {
        console.error('[Background] Failed to fetch jobs:', err);
        sendResponse({ success: false, error: err.message, jobs: [] });
      });
    return true;
  }

  if (request.action === 'GET_CURRENT_USER') {
    chrome.storage.local.get(['smarthire_user', 'smarthire_token'], (res) => {
      if (res && res.smarthire_user && res.smarthire_user.email) {
        sendResponse({ success: true, user: res.smarthire_user, token: res.smarthire_token || '', isLoggedIn: true });
      } else {
        // Strict security: Never default to any user without valid authentication
        sendResponse({ success: false, user: null, token: null, isLoggedIn: false });
      }
    });
    return true;
  }

  if (request.action === 'LOGIN_USER') {
    const { email, password } = request;
    fetch('https://smarthireus.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          chrome.storage.local.set({
            smarthire_user: data.user,
            smarthire_token: data.token,
            recruiter_email: data.user.email,
            recruiter_name: data.user.name
          }, () => {
            sendResponse({ success: true, user: data.user, token: data.token });
          });
        } else {
          sendResponse({ success: false, message: data.message || 'Invalid email or password' });
        }
      })
      .catch(err => {
        console.error('[Background] Login error:', err);
        sendResponse({ success: false, message: err.message || 'Network error connecting to SmartHire' });
      });
    return true;
  }

  if (request.action === 'LOGOUT_USER') {
    chrome.storage.local.remove(['smarthire_user', 'smarthire_token', 'recruiter_email', 'recruiter_name'], () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'SEND_OUTREACH_EMAIL') {
    const payload = request.payload || {};
    fetch('https://smarthireus.com/api/recruiter/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recruiterEmail: payload.recruiterEmail,
        recruiterName: payload.recruiterName,
        replyTo: payload.recruiterEmail,
        to: payload.to,
        subject: payload.subject,
        body: payload.body,
        html: payload.html
      })
    })
      .then(res => res.json())
      .then(data => {
        sendResponse(data);
      })
      .catch(err => {
        console.error('[Background] Send outreach error:', err);
        sendResponse({ success: false, message: err.message || 'Failed to dispatch email' });
      });
    return true;
  }

  if (request.action === 'BULK_IMPORT_ATS') {
    fetch('https://smarthireus.com/api/recruiter/sourcing/bulk-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.payload)
    })
      .then(res => res.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(err => {
        console.error('[Background] Bulk import error:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  if (request.action === 'AI_MATCH_BATCH') {
    fetch('https://smarthireus.com/api/recruiter/ai-match-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.payload)
    })
      .then(res => res.json())
      .then(data => sendResponse(data))
      .catch(err => {
        console.error('[Background] AI Match Batch error:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  if (request.action === 'AI_MATCH_CANDIDATE') {
    fetch('https://smarthireus.com/api/recruiter/ai-match-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.payload)
    })
      .then(res => res.json())
      .then(data => sendResponse(data))
      .catch(err => {
        console.error('[Background] AI Match Candidate error:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
});
