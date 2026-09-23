import tls from 'tls';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cleanMimeEmail, parseMimeWithAttachments } from './clean-mime.js';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

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

    const sendCommand = (cmd, timeoutMs = 8000) => {
      return new Promise((res, rej) => {
        const tag = `TAG${tagCounter++}`;
        const timer = setTimeout(() => {
          rej(new Error(`IMAP Command timed out after ${timeoutMs}ms: ${cmd.slice(0, 40)}...`));
        }, timeoutMs);
        currentResolver = (response, err) => {
          clearTimeout(timer);
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

        // Extract Phone Number if present in body (ignore MIME boundary zeros like 000000000000)
        let phone = '';
        const cleanForPhone = msgChunk.replace(/--0+[a-z0-9_-]+/gi, '').replace(/BODY\[TEXT\][^\n]*/gi, '');
        const phoneMatch = cleanForPhone.match(/(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]\d{2})\s*\)|([2-9]\d{2}))\s*(?:[.-]\s*)?([2-9]\d{2})\s*(?:[.-]\s*)?(\d{4}))/);
        if (phoneMatch) {
          const area = phoneMatch[1] || phoneMatch[2];
          const mid = phoneMatch[3];
          const last = phoneMatch[4];
          if (area !== '555' && mid !== '010' && last !== '0000') {
            phone = `+1 (${area}) ${mid}-${last}`;
          }
        }

        // NOTE: Skills are NOT auto-detected from email body.
        // They will be extracted from the actual resume attachment text later.
        const lowerChunk = msgChunk.toLowerCase();

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

          // NOTE: Only mark as read AFTER confirming a valid resume attachment exists (handled below)

          // Fetch complete RFC822 message payload for recruitment emails to ensure all attachments are downloaded
          let fullPayload = msgChunk;
          const hasAttachmentHint = lowerChunk.includes('boundary') ||
                                    lowerChunk.includes('filename') ||
                                    lowerChunk.includes('.pdf') ||
                                    lowerChunk.includes('.doc') ||
                                    lowerChunk.includes('multipart');
          if (uid && hasAttachmentHint) {
            try {
              console.log(`📥 Fetching full RFC822 payload for UID ${uid} (${senderName})...`);
              const fullRes = await client.sendCommand(`UID FETCH ${uid} (BODY.PEEK[])`, 10000);
              if (fullRes && fullRes.length > msgChunk.length) {
                fullPayload = fullRes;
              }
            } catch (fetchErr) {
              console.warn(`⚠️ Could not fetch full body for UID ${uid}:`, fetchErr.message);
            }
          }

          // Extract text and attachments using the upgraded MIME engine
          const { textBody: cleanBody, attachmentNames, attachments } = parseMimeWithAttachments(fullPayload);

          // Dedicated directory for candidate documents on server disk
          const candidateDocsDir = path.resolve(__dirname, '../uploads/candidate-docs');
          if (!fs.existsSync(candidateDocsDir)) {
            try {
              fs.mkdirSync(candidateDocsDir, { recursive: true });
            } catch (_) {}
          }

          const parsedResumes = [];
          const candidateDocs = {};
          let detectedVisa = null;

          // Helper: Parse candidate profiles from email body (e.g. "1. Venkata – Python / AI/ML Engineer...")
          const bodyProfiles = [];
          if (cleanBody) {
            const chunks = cleanBody.split(/(?:^|\n)\s*(?:\*?\s*\d+[\.\)]\s*\*?|\bCandidate\s+\d+[:\s])/i);
            if (chunks.length > 1) {
              for (let i = 1; i < chunks.length; i++) {
                const chunk = chunks[i].trim();
                const firstLine = chunk.split('\n')[0].trim();
                const nameRoleMatch = firstLine.match(/^\*?([A-Za-z\s]+?)\*?\s*[-–—:]\s*\*?([^\r\n*]+)/);
                const name = nameRoleMatch ? nameRoleMatch[1].replace(/[*_]/g, '').trim() : '';
                const role = nameRoleMatch ? nameRoleMatch[2].replace(/[*_]/g, '').trim() : '';
                const emailMatch = chunk.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                const email = emailMatch ? emailMatch[1].toLowerCase().trim() : '';
                const phoneMatch = chunk.match(/(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]\d{2})\s*\)|([2-9]\d{2}))\s*(?:[.-]\s*)?([2-9]\d{2})\s*(?:[.-]\s*)?(\d{4}))/);
                let candPhone = '';
                if (phoneMatch) {
                  const area = phoneMatch[1] || phoneMatch[2];
                  const mid = phoneMatch[3];
                  const last = phoneMatch[4];
                  if (area !== '555' && mid !== '010' && last !== '0000') {
                    candPhone = `+1 (${area}) ${mid}-${last}`;
                  }
                }
                const visaMatch = chunk.match(/Visa\s*:\s*([^\r\n]+)/i);
                const candVisa = visaMatch ? visaMatch[1].replace(/[*_]/g, '').trim() : '';
                const expMatch = chunk.match(/Experience\s*:\s*([^\r\n]+)/i);
                const candExp = expMatch ? expMatch[1].replace(/[*_]/g, '').trim() : '';

                if (name || email) {
                  bodyProfiles.push({ name, role, email, phone: candPhone, visa: candVisa, exp: candExp });
                }
              }
            }
          }

          for (const att of (attachments || [])) {
            const rawFn = att.filename || '';
            const lowerFn = rawFn.toLowerCase();
            const isDoc = lowerFn.endsWith('.pdf') || lowerFn.endsWith('.docx') || lowerFn.endsWith('.doc');
            const isIdDoc = (lowerFn.endsWith('.png') || lowerFn.endsWith('.jpg') || lowerFn.endsWith('.jpeg')) && 
              (lowerFn.includes('dl') || lowerFn.includes('license') || lowerFn.includes('visa') || lowerFn.includes('passport') || lowerFn.includes('i797') || lowerFn.includes('ead'));
            
            // Skip email signatures, logos, social media buttons, tracking pixels
            if (!isDoc && !isIdDoc) continue;

            const cleanBase = rawFn.replace(/[^a-zA-Z0-9.-]/g, '_');
            let safeName = `${Date.now()}_${cleanBase}`;
            let targetPath = path.join(candidateDocsDir, safeName);
            let storageUrl = `/uploads/candidate-docs/${safeName}`;

            try {
              const existingFiles = fs.readdirSync(candidateDocsDir);
              const alreadySaved = existingFiles.find(ef => ef.endsWith(`_${cleanBase}`) || ef === cleanBase);
              if (alreadySaved) {
                safeName = alreadySaved;
                targetPath = path.join(candidateDocsDir, alreadySaved);
                storageUrl = `/uploads/candidate-docs/${alreadySaved}`;
              } else if (att.content && att.content.length > 0) {
                fs.writeFileSync(targetPath, att.content);
              }
            } catch (writeErr) {
              console.warn(`⚠️ Attachment handling note ${rawFn}:`, writeErr.message);
            }

            const docEntry = {
              title: att.filename,
              fileName: att.filename,
              uploadedOn: new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
              status: 'Uploaded',
              size: `${Math.round(att.size / 1024)} KB`,
              fileType: att.contentType,
              storageUrl,
              resumeText: ''
            };

            if (isDoc) {
              let resumeText = '';
              try {
                if (lowerFn.endsWith('.pdf') || (att.contentType && att.contentType.includes('pdf'))) {
                  const pdfData = await pdfParse(att.content);
                  resumeText = (pdfData && pdfData.text) ? pdfData.text.trim() : '';
                } else if (lowerFn.endsWith('.docx') || (att.contentType && att.contentType.includes('wordprocessingml'))) {
                  const res = await mammoth.extractRawText({ buffer: att.content });
                  resumeText = (res && res.value) ? res.value.trim() : '';
                } else if (lowerFn.endsWith('.doc')) {
                  try {
                    const res = await mammoth.extractRawText({ buffer: att.content });
                    resumeText = (res && res.value) ? res.value.trim() : '';
                  } catch (_) {
                    resumeText = att.content.toString('utf8').replace(/[^\x20-\x7E\r\n\t]/g, ' ').trim();
                  }
                }
              } catch (parseErr) {
                console.warn(`⚠️ Failed parsing resume attachment ${att.filename}:`, parseErr.message);
              }

              docEntry.resumeText = resumeText;
              candidateDocs.resume = docEntry;

              let rSkills = [];
              if (resumeText) {
                const lowerR = resumeText.toLowerCase();
                rSkills = (COMMON_SKILLS || []).filter(skill => lowerR.includes(skill.toLowerCase()));
              }

              parsedResumes.push({
                filename: att.filename,
                safeName,
                size: att.size,
                contentType: att.contentType,
                storageUrl,
                resumeText,
                skills: rSkills,
                docEntry
              });
            } else if (att.docCategory === 'dlFront') {
              candidateDocs.dlFront = docEntry;
              if (!candidateDocs.dl) candidateDocs.dl = docEntry;
            } else if (att.docCategory === 'dlBack') {
              candidateDocs.dlBack = docEntry;
            } else if (att.docCategory === 'visa') {
              candidateDocs.visa = docEntry;
              if (lowerFn.includes('h1b') || lowerFn.includes('h-1b') || lowerFn.includes('i797') || lowerFn.includes('i-797')) {
                detectedVisa = 'H-1B';
              } else if (lowerFn.includes('gc') || lowerFn.includes('green')) {
                detectedVisa = 'Permanent Resident (GC)';
              } else if (lowerFn.includes('ead')) {
                detectedVisa = 'EAD';
              }
            } else if (att.docCategory === 'id') {
              candidateDocs.id = docEntry;
            }
          }

          const hasResumeAttachment = parsedResumes.length > 0;

          // User requirement: If email has NO attachment, keep it UNREAD! Do not mark as read or ingest into candidate stream!
          if (!hasResumeAttachment) {
            if (uid) {
              await client.sendCommand(`UID STORE ${uid} -FLAGS (\\Seen)`).catch(() => {});
            }
            console.log(`ℹ️ Email from ${senderEmail} ("${subject}") has no resume attachment. Kept UNREAD in inbox.`);
            continue;
          }

          // Mark message as READ in Yahoo IMAP ONLY when a valid resume attachment is parsed
          if (markAsRead && uid) {
            await client.sendCommand(`UID STORE ${uid} +FLAGS (\\Seen)`).catch((e) => {
              console.warn(`⚠️ Could not mark UID ${uid} as seen:`, e.message);
            });
          }

          // Helper: Derive candidate name from filename (e.g. "DhirenRavalResume.pdf" -> "Dhiren Raval")
          const deriveNameFromFilename = (fn = '') => {
            let base = fn.replace(/\.(pdf|docx?|doc)$/i, '');
            base = base.replace(/(?:resume|cv|profile|dossier|final|updated|new|hotlist)/gi, '');
            base = base.replace(/[_-]+/g, ' ').replace(/\(\d+\)/g, '').trim();
            base = base.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
            const words = base.split(/\s+/).filter(w => w.length >= 2 && !/^(developer|engineer|lead|architect|java|python|qa|sdet|c2c|h1b|data)$/i.test(w));
            if (words.length >= 1) {
              return words.slice(0, 3).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            }
            return '';
          };

          // INGEST EACH RESUME AS A CANDIDATE PROFILE
          for (let rIdx = 0; rIdx < parsedResumes.length; rIdx++) {
            const r = parsedResumes[rIdx];

            // Try matching this resume to a profile in the email body by name tokens
            let matchedProfile = bodyProfiles.find(bp => {
              if (!bp.name) return false;
              const nameParts = bp.name.toLowerCase().split(/\s+/).filter(p => p.length >= 3);
              return nameParts.some(part => r.filename.toLowerCase().includes(part));
            });

            // Fallback: only match by index if total counts match exactly
            if (!matchedProfile && bodyProfiles.length === parsedResumes.length) {
              matchedProfile = bodyProfiles[rIdx];
            }

            // 1. Resolve candidate name
            let candidateName = (matchedProfile && matchedProfile.name) ? matchedProfile.name : '';
            if (!candidateName) {
              candidateName = deriveNameFromFilename(r.filename);
            }
            if (!candidateName && r.resumeText) {
              const firstLines = r.resumeText.split('\n').map(l => l.trim()).filter(Boolean);
              for (const line of firstLines.slice(0, 5)) {
                if (!line.includes('@') && !line.includes('http') && !line.includes('www') && !/^(resume|curriculum|profile|summary|skills|objective)/i.test(line)) {
                  const cleaned = line.replace(/[^a-zA-Z\s.-]/g, '').trim();
                  const words = cleaned.split(/\s+/);
                  if (words.length >= 2 && words.length <= 4 && words.every(w => w.length >= 2)) {
                    candidateName = words.map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                    break;
                  }
                }
              }
            }
            if (!candidateName) {
              candidateName = parsedResumes.length === 1 ? senderName : `Candidate ${rIdx + 1}`;
            }

            // 2. Resolve candidate email
            let candidateEmail = (matchedProfile && matchedProfile.email) ? matchedProfile.email : '';
            if (!candidateEmail && r.resumeText) {
              const em = r.resumeText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(?:com|org|net|edu|io|in|co|us|gov|mil|ai))\b/i);
              if (em) candidateEmail = em[1].toLowerCase().trim();
            }
            if (!candidateEmail) {
              candidateEmail = (parsedResumes.length === 1 ? senderEmail : `${candidateName.toLowerCase().replace(/\s+/g, '.')}.${senderEmail}`);
            }

            // 3. Resolve candidate phone
            let candidatePhone = (matchedProfile && matchedProfile.phone) ? matchedProfile.phone : '';
            if (!candidatePhone && r.resumeText) {
              const pm = r.resumeText.match(/(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]\d{2})\s*\)|([2-9]\d{2}))\s*(?:[.-]\s*)?([2-9]\d{2})\s*(?:[.-]\s*)?(\d{4}))/);
              if (pm) {
                const area = pm[1] || pm[2];
                const mid = pm[3];
                const last = pm[4];
                if (area !== '555' && mid !== '010' && last !== '0000') {
                  candidatePhone = `+1 (${area}) ${mid}-${last}`;
                }
              }
            }
            if (!candidatePhone) candidatePhone = phone || '';

            // 4. Resolve candidate role
            let cRole = (matchedProfile && matchedProfile.role) ? matchedProfile.role : '';
            if (!cRole && r.resumeText) {
              const firstLines = r.resumeText.split('\n').map(l => l.trim()).filter(Boolean);
              for (const line of firstLines.slice(1, 6)) {
                if (line.includes('|') || /(engineer|developer|architect|manager|lead|analyst|specialist|administrator)/i.test(line)) {
                  cRole = line.split('|')[0].trim();
                  break;
                }
              }
            }
            if (!cRole) cRole = candidateRole || 'IT Specialist';

            // 5. Resolve candidate visa
            let candidateVisa = (matchedProfile && matchedProfile.visa) ? matchedProfile.visa : '';
            if (!candidateVisa && r.resumeText) {
              const lowerR = r.resumeText.toLowerCase();
              if (lowerR.includes('us citizen') || lowerR.includes('u.s. citizen')) candidateVisa = 'US Citizen';
              else if (lowerR.includes('green card') || lowerR.includes('permanent resident')) candidateVisa = 'Permanent Resident (GC)';
              else if (lowerR.includes('h-1b') || lowerR.includes('h1b') || lowerR.includes('i-797')) candidateVisa = 'H-1B';
              else if (lowerR.includes('ead')) candidateVisa = 'EAD';
            }
            if (!candidateVisa) candidateVisa = detectedVisa || 'H-1B';

            // 6. Resolve experience
            const candidateExp = (matchedProfile && matchedProfile.exp)
              ? matchedProfile.exp
              : '5+ Years';

            const primaryFileObj = {
              original_name: r.filename,
              stored_name: r.safeName,
              size_bytes: r.size,
              mime_type: r.contentType,
              local_path: r.storageUrl
            };

            const candidateDocsCopy = {
              ...candidateDocs,
              resume: r.docEntry
            };

            results.push({
              name: candidateName,
              email: candidateEmail,
              phone: candidatePhone,
              subject,
              role: cRole,
              skills: r.skills && r.skills.length > 0 ? r.skills : [],
              date,
              folder: folder === 'Bulk' ? 'SPAM' : folder,
              uid,
              isSpamRecovery: folder === 'Bulk',
              resumeText: r.resumeText || '',
              attachmentName: r.filename,
              attachments: [r.filename],
              file: primaryFileObj,
              documents: candidateDocsCopy,
              legalDocs: candidateDocsCopy,
              visaStatus: candidateVisa,
              experience: candidateExp,
              vendorName: senderName,
              vendorEmail: senderEmail
            });
          }
        }
      }
    }

    // 3. LOGOUT
    await client.sendCommand('LOGOUT').catch(() => {});
  } finally {
    client.socket.end();
  }

  // Automatically sync vendor bench candidates into vendor_hotlists.json
  try {
    const vhFile = path.resolve(__dirname, '../vendor_hotlists.json');
    let existingHotlists = [];
    if (fs.existsSync(vhFile)) {
      existingHotlists = JSON.parse(fs.readFileSync(vhFile, 'utf8'));
    }
    let addedToHotlists = 0;
    for (const cand of results) {
      if (!cand.vendorEmail && !cand.email) continue;
      const cName = (cand.name || '').trim();
      const vEmail = (cand.vendorEmail || '').toLowerCase().trim();
      const cEmail = (cand.email || '').toLowerCase().trim();

      const exists = existingHotlists.some(ex => {
        if (cEmail && ex.candidateEmail && ex.candidateEmail.toLowerCase() === cEmail) return true;
        if (ex.candidateName.toLowerCase() === cName.toLowerCase() && ex.vendorEmail.toLowerCase() === vEmail) return true;
        return false;
      });

      if (!exists) {
        existingHotlists.unshift({
          id: `vh-${Date.now()}-${Math.floor(Math.random()*900+100)}`,
          vendorName: cand.vendorName || 'Staffing Vendor',
          vendorCompany: cand.vendorName ? `${cand.vendorName} Agency` : 'Vendor Partner',
          vendorEmail: cand.vendorEmail || '',
          vendorPhone: cand.phone || '',
          candidateName: cName,
          role: cand.role || 'IT Specialist',
          candidateEmail: cand.email || '',
          candidatePhone: cand.phone || '',
          visa: cand.visaStatus || 'H-1B',
          location: cand.location || 'Remote / US',
          experience: cand.experience || '8+ Years',
          skills: cand.skills || [],
          rate: '$70/hr',
          relocation: 'Open',
          receivedDate: cand.date || new Date().toISOString(),
          sourceEmailSubject: cand.subject || 'Vendor Candidate Bench',
          attachmentName: cand.attachmentName || null,
          storageUrl: cand.file?.local_path || '',
          status: 'Available'
        });
        addedToHotlists++;
      }
    }
    if (addedToHotlists > 0) {
      fs.writeFileSync(vhFile, JSON.stringify(existingHotlists, null, 2));
      console.log(`📋 Synced ${addedToHotlists} new candidate(s) to Vendor Hotlists database.`);
    }
  } catch(hotlistErr) {
    console.warn('⚠️ Hotlist auto-sync notice:', hotlistErr.message);
  }

  console.log(`🎯 IMAP Scan completed! Ingested & marked read: ${results.length} candidate application emails.`);
  return results;
}
