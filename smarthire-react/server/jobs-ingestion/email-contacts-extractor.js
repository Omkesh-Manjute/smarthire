import tls from 'tls';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory & storage path
const DATA_DIR = path.resolve(__dirname, '../data');
const CONTACTS_FILE = path.join(DATA_DIR, 'extracted_contacts.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Decode RFC2047 MIME encoded-words (e.g. =?UTF-8?B?...?= or =?UTF-8?Q?...?=)
 */
export function decodeMimeWord(str) {
  if (!str) return '';
  return str.replace(/=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g, (match, charset, enc, text) => {
    try {
      if (enc.toUpperCase() === 'B') {
        return Buffer.from(text, 'base64').toString('utf8');
      } else if (enc.toUpperCase() === 'Q') {
        return text.replace(/_/g, ' ').replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
      }
    } catch (_) {}
    return match;
  }).replace(/["']/g, '').trim();
}

/**
 * Common known company overrides and title-casing
 */
const KNOWN_COMPANIES = {
  'coolsofttech.com': 'COOLSOFT LLC',
  'infoorigin.com': 'Info Origin',
  'ilogictek.com': 'Ilogictek',
  'purexcel.com': 'Purexcel',
  'techvectorminds.com': 'Tech Vector Minds',
  'techrakers.com': 'Techrakers',
  'infosys.com': 'Infosys',
  'tcs.com': 'TCS',
  'wipro.com': 'Wipro',
  'cognizant.com': 'Cognizant',
  'accenture.com': 'Accenture',
  'deloitte.com': 'Deloitte',
  'capgemini.com': 'Capgemini',
  'hcltech.com': 'HCLTech',
  'techmahindra.com': 'Tech Mahindra',
  'kforce.com': 'Kforce',
  'teksystems.com': 'TEKsystems',
  'apexsystems.com': 'Apex Systems',
  'roberthalf.com': 'Robert Half',
  'randstadusa.com': 'Randstad',
  'insightglobal.com': 'Insight Global',
  'collabera.com': 'Collabera',
  'diversant.com': 'Diversant',
  'judge.com': 'The Judge Group'
};

const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'ymail.com', 'rocketmail.com',
  'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'rediffmail.com', 'proton.me', 'protonmail.com',
  'zoho.com', 'mail.com', 'gmx.com'
]);

const IGNORE_DOMAINS = new Set([
  'linkedin.com', 'notifications.linkedin.com', 'bounce.linkedin.com',
  'google.com', 'googlemail.com', 'accounts.google.com',
  'yahoo.com', 'yahoogroups.com', 'mail.yahoo.com', 'cc.yahoo-inc.com',
  'facebookmail.com', 'twitter.com', 'x.com', 'instagram.com',
  'zoom.us', 'github.com', 'slack.com', 'microsoft.com',
  'accountprotection.microsoft.com', 'apple.com', 'amazon.com', 'amazonaws.com',
  'quora.com', 'pinterest.com', 'medium.com', 'youtube.com',
  'calendly.com', 'docusign.net', 'hellosign.com', 'uber.com', 'swiggy.in', 'zomato.com'
]);

const IGNORE_LOCAL_PARTS = [
  'no-reply', 'noreply', 'mailer-daemon', 'postmaster', 'notifications',
  'notification', 'donotreply', 'bounce', 'security', 'billing', 'news', 'alerts'
];

/**
 * Format domain into a clean company name
 */
export function domainToCompanyName(domain) {
  if (!domain) return 'Direct / Individual';
  const cleanDomain = domain.toLowerCase().trim();
  
  if (KNOWN_COMPANIES[cleanDomain]) {
    return KNOWN_COMPANIES[cleanDomain];
  }
  
  if (PERSONAL_DOMAINS.has(cleanDomain)) {
    return 'Independent / Direct';
  }

  // Remove subdomains like mail., smtp., etc.
  const parts = cleanDomain.split('.');
  let mainName = parts[0];
  if (parts.length > 2 && (mainName === 'mail' || mainName === 'smtp' || mainName === 'webmail' || mainName === 'email')) {
    mainName = parts[1];
  }

  // Convert hyphens or underscores to spaces, capitalize words
  return mainName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Parse an RFC822 From/To header line into { name, email, domain, company, type }
 */
export function parseEmailHeaderLine(rawHeader, folder = 'INBOX') {
  if (!rawHeader) return null;
  const decoded = decodeMimeWord(rawHeader.trim());

  // Matches "Name <email@domain.com>", "<email@domain.com>", or "email@domain.com"
  const match = decoded.match(/^(?:"?([^"<]*)"?\s*)?<?([a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}))>?/);
  if (!match) return null;

  let rawName = (match[1] || '').trim();
  const email = match[2].toLowerCase().trim();
  const domain = match[3].toLowerCase().trim();

  // Filter out system and social notifications
  if (IGNORE_DOMAINS.has(domain) || domain.includes('linkedin') || domain.includes('notification')) {
    return null;
  }

  const localPart = email.split('@')[0];
  if (IGNORE_LOCAL_PARTS.some(p => localPart === p || localPart.startsWith(p + '-') || localPart.startsWith(p + '+'))) {
    return null;
  }

  const isPersonal = PERSONAL_DOMAINS.has(domain);
  const type = isPersonal ? 'Personal / Direct' : 'Corporate';
  const company = domainToCompanyName(domain);

  // If name is just the email or empty, format localPart nicely
  if (!rawName || rawName.includes('@')) {
    rawName = localPart.replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  return {
    name: rawName,
    email,
    domain,
    company,
    type,
    folder
  };
}

/**
 * Execute IMAP command with timeout
 */
function sendImapCommand(socket, tagRef, cmd, timeoutMs = 35000) {
  return new Promise((resolve, reject) => {
    const currentTag = `TAG${tagRef.counter++}`;
    let buffer = '';
    const timer = setTimeout(() => {
      socket.removeListener('data', onData);
      reject(new Error(`IMAP Command timed out (${timeoutMs}ms): ${cmd.slice(0, 40)}`));
    }, timeoutMs);

    function onData(data) {
      buffer += data;
      if (
        buffer.includes(`${currentTag} OK`) ||
        buffer.includes(`${currentTag} NO`) ||
        buffer.includes(`${currentTag} BAD`)
      ) {
        clearTimeout(timer);
        socket.removeListener('data', onData);
        resolve(buffer);
      }
    }

    socket.on('data', onData);
    socket.write(`${currentTag} ${cmd}\r\n`);
  });
}

/**
 * Main function: Connects to Yahoo/IMAP, scans headers, deduplicates, and saves contacts
 */
export async function extractContactsFromIMAP({
  host = 'imap.mail.yahoo.com',
  port = 993,
  user = 'omkesh@coolsofttech.com',
  password,
  folders = ['INBOX', 'Sent', 'Hotlist'],
  maxEmailsPerFolder = 10000
} = {}) {
  const cleanPass = String(password || process.env.IMAP_PASS || 'ykbmemlfgywcjrbo').replace(/\s+/g, '');
  const cleanHost = host.includes('bizmail') ? 'imap.mail.yahoo.com' : host;

  console.log(`\n📬 [Contacts Extractor] Connecting to ${cleanHost}:${port} for ${user}...`);

  const contactsMap = new Map();

  // Load existing contacts if available to preserve history
  try {
    if (fs.existsSync(CONTACTS_FILE)) {
      const existing = JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8'));
      if (Array.isArray(existing.contacts)) {
        for (const c of existing.contacts) {
          if (c.email) contactsMap.set(c.email.toLowerCase(), c);
        }
        console.log(`Loaded ${contactsMap.size} previously extracted contacts from cache.`);
      }
    }
  } catch (err) {
    console.warn('Could not read existing contacts file:', err.message);
  }

  const socket = tls.connect(
    {
      host: cleanHost,
      port: parseInt(port) || 993,
      minVersion: 'TLSv1.2',
      rejectUnauthorized: false
    }
  );
  socket.setEncoding('utf8');

  const tagRef = { counter: 1 };

  await new Promise((resolve, reject) => {
    const greetingTimeout = setTimeout(() => reject(new Error('IMAP Greeting timeout')), 12000);
    socket.once('data', d => {
      clearTimeout(greetingTimeout);
      if (d.includes('* OK')) resolve();
      else reject(new Error('Unexpected greeting: ' + d));
    });
    socket.once('error', reject);
  });

  try {
    const loginRes = await sendImapCommand(socket, tagRef, `LOGIN "${user}" "${cleanPass}"`);
    if (!loginRes || loginRes.includes('NO') || loginRes.includes('BAD')) {
      throw new Error(`IMAP Login failed for ${user}`);
    }
    console.log(`✅ [Contacts Extractor] Logged in to IMAP successfully`);

    for (const rawFolder of folders) {
      const folderName = rawFolder.trim();
      console.log(`📂 Scanning folder: "${folderName}"...`);

      const selRes = await sendImapCommand(socket, tagRef, `SELECT "${folderName}"`);
      if (!selRes || selRes.includes('NO') || selRes.includes('BAD')) {
        console.warn(`Could not select folder ${folderName}, skipping.`);
        continue;
      }

      const matchCount = selRes.match(/\*\s+(\d+)\s+EXISTS/i);
      const totalInFolder = matchCount ? parseInt(matchCount[1]) : 0;
      console.log(`Total messages in ${folderName}: ${totalInFolder}`);
      if (totalInFolder === 0) continue;

      const limit = Math.min(totalInFolder, maxEmailsPerFolder);
      const chunkSize = 2000;
      const isSent = folderName.toLowerCase().includes('sent');
      const headerFields = isSent ? '(TO CC DATE)' : '(FROM DATE)';

      for (let end = totalInFolder; end > (totalInFolder - limit); end -= chunkSize) {
        const start = Math.max(1, end - chunkSize + 1);
        console.log(`Fetching ${folderName} [${start}:${end}]...`);

        try {
          const rawChunk = await sendImapCommand(
            socket,
            tagRef,
            `FETCH ${start}:${end} (BODY.PEEK[HEADER.FIELDS ${headerFields}])`,
            40000
          );

          // Parse RFC822 header stream
          const lines = rawChunk.split(/\r?\n/);
          let curLine = '';
          let curDate = '';

          for (const line of lines) {
            if (line.startsWith('From: ') || line.startsWith('To: ') || line.startsWith('Cc: ')) {
              curLine = line.replace(/^(From|To|Cc):\s*/, '').trim();
            } else if (line.startsWith('Date: ')) {
              curDate = line.slice(6).trim();

              if (curLine) {
                // If line contains multiple addresses separated by commas (common in To/Cc)
                const parts = curLine.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
                for (const part of parts) {
                  const parsed = parseEmailHeaderLine(part, folderName);
                  if (parsed) {
                    const key = parsed.email;
                    const existing = contactsMap.get(key);

                    if (!existing) {
                      contactsMap.set(key, {
                        ...parsed,
                        lastDate: curDate || new Date().toISOString(),
                        interactionCount: 1,
                        folders: [folderName]
                      });
                    } else {
                      // Update existing contact
                      existing.interactionCount = (existing.interactionCount || 1) + 1;
                      if (!existing.folders.includes(folderName)) {
                        existing.folders.push(folderName);
                      }
                      // Keep more recent date if available
                      if (curDate && (!existing.lastDate || new Date(curDate) > new Date(existing.lastDate))) {
                        existing.lastDate = curDate;
                      }
                      // Prefer a proper name over localPart fallback
                      if (parsed.name && parsed.name.length > 2 && parsed.name !== parsed.email.split('@')[0]) {
                        existing.name = parsed.name;
                      }
                      if (parsed.type === 'Corporate' && existing.type !== 'Corporate') {
                        existing.type = 'Corporate';
                        existing.company = parsed.company;
                      }
                    }
                  }
                }
                curLine = '';
                curDate = '';
              }
            }
          }
        } catch (fetchErr) {
          console.warn(`⚠️ Error fetching chunk ${start}:${end} in ${folderName}:`, fetchErr.message);
        }
      }
    }
  } finally {
    try {
      socket.write(`TAG${tagRef.counter++} LOGOUT\r\n`);
      socket.end();
    } catch (_) {}
  }

  // Convert map to sorted array (Corporate first, then by latest interaction)
  const contacts = Array.from(contactsMap.values()).sort((a, b) => {
    // Put Corporate before Personal
    if (a.type !== b.type) {
      return a.type === 'Corporate' ? -1 : 1;
    }
    // Then sort by company name alphabetically
    if (a.company !== b.company) {
      return a.company.localeCompare(b.company);
    }
    return (b.interactionCount || 0) - (a.interactionCount || 0);
  });

  const corporateCount = contacts.filter(c => c.type === 'Corporate').length;
  const personalCount = contacts.filter(c => c.type !== 'Corporate').length;

  const resultData = {
    updatedAt: new Date().toISOString(),
    account: user,
    total: contacts.length,
    corporateCount,
    personalCount,
    contacts
  };

  // Persist to disk
  fs.writeFileSync(CONTACTS_FILE, JSON.stringify(resultData, null, 2), 'utf8');
  console.log(`\n🎉 [Contacts Extractor] Saved ${contacts.length} deduplicated contacts (${corporateCount} corporate) to ${CONTACTS_FILE}`);

  return resultData;
}

/**
 * Quick synchronous reader of cached contacts
 */
export function getCachedContacts() {
  try {
    if (fs.existsSync(CONTACTS_FILE)) {
      return JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8'));
    }
  } catch (err) {
    console.warn('Could not read cached contacts:', err.message);
  }
  return {
    updatedAt: null,
    account: 'omkesh@coolsofttech.com',
    total: 0,
    corporateCount: 0,
    personalCount: 0,
    contacts: []
  };
}
