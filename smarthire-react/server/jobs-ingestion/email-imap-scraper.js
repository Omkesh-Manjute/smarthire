import tls from 'tls';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Normalize folder name specifically for Yahoo / standard IMAP servers.
 * In Yahoo IMAP, Spam folder is strictly named "Bulk".
 */
export function normalizeImapFolder(folder) {
  const up = String(folder || '').toUpperCase().trim();
  if (up === 'SPAM' || up === 'JUNK' || up === 'BULK') return 'Bulk';
  if (up === 'INBOX') return 'Inbox';
  if (up === 'SENT' || up === 'SENT ITEMS') return 'Sent';
  if (up === 'TRASH') return 'Trash';
  if (up === 'DRAFT' || up === 'DRAFTS') return 'Draft';
  return folder;
}

/**
 * Common technical skills dictionary for fast parsing from subject & email body
 */
const COMMON_SKILLS = [
  'Java', 'Spring Boot', 'Microservices', 'Hibernate', 'J2EE',
  'Python', 'Django', 'FastAPI', 'Flask',
  'React', 'Angular', 'Vue', 'JavaScript', 'TypeScript', 'Node.js', 'Next.js',
  'C#', '.NET', 'ASP.NET',
  'SQL', 'PostgreSQL', 'Oracle', 'MySQL', 'MongoDB', 'Snowflake', 'Databricks',
  'AWS', 'Azure', 'GCP', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'DevOps',
  'QA Automation', 'SDET', 'Selenium', 'Cypress', 'Playwright', 'TestNG', 'Cucumber', 'Manual Testing',
  'Cisco', 'Palo Alto', 'Firewall', 'Network Security', 'Routing', 'Switching',
  'Data Governance', 'Power BI', 'Tableau', 'ETL', 'Informatica', 'Collibra',
  'Business Analyst', 'Product Owner', 'Scrum Master', 'Agile', 'JIRA', 'BRD', 'UAT',
  'Salesforce', 'SAP', 'Workday', 'ServiceNow'
];

/**
 * Appends an outbound RFC822 message to the IMAP "Sent" folder with the \Seen flag
 * so that emails sent via SMTP appear in Yahoo Webmail Sent tab (mail.yahoo.com/d/folders/2).
 */
export async function appendEmailToSentFolder({
  host = 'imap.mail.yahoo.com',
  port = 993,
  user = 'omkesh@coolsofttech.com',
  password,
  from,
  to,
  subject,
  text = '',
  html = ''
}) {
  if (!password) {
    console.warn('⚠️ Cannot append to Sent folder: No IMAP password provided.');
    return false;
  }

  const cleanPass = String(password).replace(/\s+/g, '');
  const cleanHost = host.includes('bizmail') ? 'imap.mail.yahoo.com' : host;

  return new Promise((resolve) => {
    let tagCounter = 1;
    let buffer = '';
    let socket = null;

    const cleanup = () => {
      try { if (socket && !socket.destroyed) socket.end(); } catch (_) {}
    };

    const timeout = setTimeout(() => {
      console.warn('⚠️ IMAP Append to Sent timed out after 10s');
      cleanup();
      resolve(false);
    }, 10000);

    try {
      socket = tls.connect(
        {
          host: cleanHost,
          port: parseInt(port) || 993,
          minVersion: 'TLSv1.2',
          rejectUnauthorized: false
        },
        () => {}
      );

      socket.setEncoding('utf8');

      const sendCmd = (cmd) => {
        const tag = `TAG${tagCounter++}`;
        return new Promise((res, rej) => {
          const onData = (data) => {
            buffer += data;
            if (buffer.includes(`${tag} OK`) || buffer.includes(`${tag} NO`) || buffer.includes(`${tag} BAD`)) {
              const out = buffer;
              buffer = '';
              socket.removeListener('data', onData);
              if (out.includes(`${tag} OK`)) res(out);
              else rej(new Error(out));
            }
          };
          socket.on('data', onData);
          socket.write(`${tag} ${cmd}\r\n`);
        });
      };

      socket.once('data', async (greeting) => {
        if (!greeting.includes('* OK')) {
          clearTimeout(timeout);
          cleanup();
          return resolve(false);
        }

        try {
          // 1. LOGIN
          await sendCmd(`LOGIN "${user}" "${cleanPass}"`);

          // 2. Build RFC822 message
          const toStr = Array.isArray(to) ? to.join(', ') : to;
          const fromStr = from.includes('<') ? from : `"${user}" <${user}>`;
          const rawMessage = [
            `From: ${fromStr}`,
            `To: ${toStr}`,
            `Subject: ${subject || 'Outreach from SmartHire ATS'}`,
            `Date: ${new Date().toUTCString()}`,
            `MIME-Version: 1.0`,
            `Content-Type: ${html ? 'text/html' : 'text/plain'}; charset=utf-8`,
            '',
            html || text || ''
          ].join('\r\n');

          const msgByteLen = Buffer.byteLength(rawMessage, 'utf8');
          const appendTag = `TAG${tagCounter++}`;

          const appendPromise = new Promise((res, rej) => {
            const onAppendData = (d) => {
              buffer += d;
              if (buffer.includes(`${appendTag} OK`) || buffer.includes(`${appendTag} NO`) || buffer.includes(`${appendTag} BAD`)) {
                const out = buffer;
                buffer = '';
                socket.removeListener('data', onAppendData);
                if (out.includes(`${appendTag} OK`)) res(out);
                else rej(new Error(out));
              }
            };
            socket.on('data', onAppendData);
          });

          // Write APPEND command with \Seen flag so it appears read in Sent folder
          socket.write(`${appendTag} APPEND "Sent" (\\Seen) {${msgByteLen}}\r\n`);
          setTimeout(() => {
            try { socket.write(rawMessage + '\r\n'); } catch (_) {}
          }, 250);

          await appendPromise;
          console.log(`✅ Outbound email successfully appended to Yahoo IMAP "Sent" folder for ${user}!`);

          await sendCmd('LOGOUT').catch(() => {});
          clearTimeout(timeout);
          cleanup();
          resolve(true);
        } catch (err) {
          console.warn('⚠️ IMAP Append error:', err.message);
          clearTimeout(timeout);
          cleanup();
          resolve(false);
        }
      });

      socket.on('error', (err) => {
        console.warn('⚠️ IMAP Append socket error:', err.message);
        clearTimeout(timeout);
        cleanup();
        resolve(false);
      });
    } catch (err) {
      clearTimeout(timeout);
      cleanup();
      resolve(false);
    }
  });
}

/**
 * Pure Node.js TLS-based IMAP Scraper Client
 * Scans emails from Inbox and Bulk (Spam) folders, extracts candidate info,
 * and automatically marks processed emails as READ (\Seen) in Yahoo Mail.
 */
export async function scrapeResumesFromIMAP({
  host = 'imap.mail.yahoo.com',
  port = 993,
  user = 'omkesh@coolsofttech.com',
  password,
  folders = ['INBOX', 'SPAM'],
  maxEmails = 30,
  markAsRead = true
}) {
  if (!password) {
    throw new Error('IMAP password or App Password is required.');
  }

  const cleanPass = String(password).replace(/\s+/g, '');
  const cleanHost = host.includes('bizmail') ? 'imap.mail.yahoo.com' : host;
  console.log(`\n📬 Connecting to IMAP server ${cleanHost}:${port} for ${user}...`);

  const results = [];
  const uploadsDir = path.resolve(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Connect via TLS socket
  const client = await new Promise((resolve, reject) => {
    let tagCounter = 1;
    let buffer = '';
    let currentResolver = null;

    const socket = tls.connect(
      {
        host: cleanHost,
        port: parseInt(port) || 993,
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false
      },
      () => {
        console.log(`🔒 TLS Connection established with ${cleanHost}:${port}`);
      }
    );

    socket.setEncoding('utf8');

    socket.on('data', data => {
      buffer += data;
      if (currentResolver && (buffer.includes(`TAG${tagCounter - 1} OK`) || buffer.includes(`TAG${tagCounter - 1} NO`) || buffer.includes(`TAG${tagCounter - 1} BAD`))) {
        const out = buffer;
        buffer = '';
        currentResolver(out);
      }
    });

    socket.on('error', err => {
      console.error('❌ IMAP Socket Error:', err.message);
      if (currentResolver) currentResolver(null, err);
      reject(err);
    });

    const sendCommand = cmd => {
      return new Promise((res, rej) => {
        const tag = `TAG${tagCounter++}`;
        currentResolver = (response, err) => {
          if (err) return rej(err);
          res(response);
        };
        socket.write(`${tag} ${cmd}\r\n`);
      });
    };

    // Wait for initial greeting (* OK)
    const timeout = setTimeout(() => reject(new Error('IMAP Connection timed out waiting for server greeting')), 12000);

    const onInitialData = data => {
      if (data.includes('* OK')) {
        clearTimeout(timeout);
        socket.removeListener('data', onInitialData);
        resolve({ socket, sendCommand });
      }
    };
    socket.on('data', onInitialData);
  });

  try {
    // 1. LOGIN
    const loginRes = await client.sendCommand(`LOGIN "${user}" "${cleanPass}"`);
    if (!loginRes || loginRes.includes('NO') || loginRes.includes('BAD')) {
      throw new Error(`IMAP Authentication failed for ${user}. Please check your App Password.`);
    }
    console.log(`✅ Logged in to IMAP as ${user}`);

    // 2. Scan folders (e.g. Inbox, Bulk/Spam)
    for (const rawFolder of folders) {
      const folder = normalizeImapFolder(rawFolder);
      console.log(`📂 Checking IMAP folder: ${folder} (original: ${rawFolder})...`);
      
      const selectRes = await client.sendCommand(`SELECT "${folder}"`);
      if (!selectRes || selectRes.includes('NO') || selectRes.includes('BAD')) {
        console.warn(`⚠️ Folder ${folder} could not be selected, skipping.`);
        continue;
      }

      // Check number of messages
      const existsMatch = selectRes.match(/\*\s+(\d+)\s+EXISTS/i);
      const totalMessages = existsMatch ? parseInt(existsMatch[1]) : 0;
      console.log(`📊 Total messages in ${folder}: ${totalMessages}`);

      if (totalMessages === 0) continue;

      // Fetch last N messages
      const fetchStart = Math.max(1, totalMessages - maxEmails + 1);
      const fetchRange = `${fetchStart}:${totalMessages}`;
      console.log(`🔍 Fetching headers & bodies for range ${fetchRange}...`);

      const fetchRes = await client.sendCommand(`FETCH ${fetchRange} (UID FLAGS BODY.PEEK[HEADER.FIELDS (FROM TO SUBJECT DATE)] BODY.PEEK[TEXT]<0.25000>)`);

      // Parse individual messages from fetch output
      const rawMessages = fetchRes.split(/\*\s+\d+\s+FETCH/i).filter(Boolean);

      for (const msgChunk of rawMessages) {
        // Extract UID
        const uidMatch = msgChunk.match(/UID\s+(\d+)/i);
        const uid = uidMatch ? uidMatch[1] : null;

        // Check current flags
        const isAlreadySeen = msgChunk.includes('\\Seen');

        // Extract Subject
        const subMatch = msgChunk.match(/Subject:\s*([^\r\n]+)/i);
        let subject = subMatch ? subMatch[1].trim() : 'Candidate Application';
        // Clean MIME Q-encoding if present
        if (subject.includes('=?UTF-8?')) {
          subject = subject.replace(/=\?UTF-8\?[QB]\?[^?]+\?=/gi, (m) => {
            try {
              const parts = m.split('?');
              if (parts[2].toUpperCase() === 'B') return Buffer.from(parts[3], 'base64').toString('utf8');
              if (parts[2].toUpperCase() === 'Q') return parts[3].replace(/=([A-F0-9]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16))).replace(/_/g, ' ');
            } catch (_) {}
            return m;
          });
        }

        // Extract From
        const fromMatch = msgChunk.match(/From:\s*([^\r\n]+)/i);
        const fromRaw = fromMatch ? fromMatch[1].trim() : '';
        const emailMatch = fromRaw.match(/<([^>]+)>/) || fromRaw.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        const senderEmail = emailMatch ? emailMatch[1].toLowerCase().trim() : '';
        let senderName = fromRaw.replace(/<[^>]+>/, '').replace(/"/g, '').trim() || senderEmail.split('@')[0] || 'Applicant';
        // Clean up common prefixes/suffixes
        senderName = senderName.replace(/^RE:\s*/i, '').trim();

        // Extract Date
        const dateMatch = msgChunk.match(/Date:\s*([^\r\n]+)/i);
        const date = dateMatch ? dateMatch[1].trim() : new Date().toISOString();

        // Extract Phone Number if present in body
        const phoneMatch = msgChunk.match(/(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        const phone = phoneMatch ? phoneMatch[0].trim() : '+1 (555) 010-0000';

        // Detect technical skills from Subject and Body
        const lowerChunk = msgChunk.toLowerCase();
        const detectedSkills = COMMON_SKILLS.filter(skill => {
          const sLower = skill.toLowerCase();
          return lowerChunk.includes(sLower);
        });

        // Determine if recruitment/job application related
        const isRecruitmentRelated =
          lowerChunk.includes('resume') ||
          lowerChunk.includes('candidate') ||
          lowerChunk.includes('developer') ||
          lowerChunk.includes('engineer') ||
          lowerChunk.includes('analyst') ||
          lowerChunk.includes('consultant') ||
          lowerChunk.includes('c2c') ||
          lowerChunk.includes('hotlist') ||
          lowerChunk.includes('lead') ||
          lowerChunk.includes('profile') ||
          lowerChunk.includes('experience') ||
          lowerChunk.includes('application') ||
          lowerChunk.includes('submission');

        // Ignore emails sent by recruiter to themselves or group alerts that have no candidate email
        const isSelf = senderEmail === user.toLowerCase();

        if (senderEmail && !isSelf && isRecruitmentRelated) {
          // Extract Candidate Role from Subject or Content
          let candidateRole = subject
            .replace(/^RE\s*:\s*/i, '')
            .replace(/^FWD\s*:\s*/i, '')
            .replace(/^Resume\s+for\s+/i, '')
            .replace(/^Confirmed\s*:\s*/i, '')
            .trim();
          
          if (candidateRole.length > 70) {
            candidateRole = candidateRole.slice(0, 67) + '...';
          }

          // Mark message as READ in Yahoo IMAP if requested
          if (markAsRead && uid) {
            await client.sendCommand(`UID STORE ${uid} +FLAGS (\\Seen)`).catch((e) => {
              console.warn(`⚠️ Could not mark UID ${uid} as seen:`, e.message);
            });
          }

          results.push({
            name: senderName,
            email: senderEmail,
            phone,
            subject,
            role: candidateRole || 'IT Specialist',
            skills: detectedSkills.length > 0 ? detectedSkills : ['Java', 'SQL', 'Cloud Technologies'],
            date,
            folder: folder === 'Bulk' ? 'SPAM' : folder,
            uid,
            isSpamRecovery: folder === 'Bulk',
            rawPreview: msgChunk.slice(0, 500)
          });
        }
      }
    }

    // 3. LOGOUT
    await client.sendCommand('LOGOUT').catch(() => {});
  } finally {
    client.socket.end();
  }

  console.log(`🎯 IMAP Scan completed! Ingested & marked read: ${results.length} candidate application emails.`);
  return results;
}
