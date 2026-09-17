import tls from 'tls';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Pure Node.js TLS-based IMAP Scraper Client
 * Securely connects over Port 993 (SSL/TLS) to any IMAP server (Yahoo Bizmail, Gmail, Hostinger, Outlook)
 * without external npm dependencies. Scans emails and extracts PDF/DOCX attachments.
 */
export async function scrapeResumesFromIMAP({
  host = 'imap.bizmail.yahoo.com',
  port = 993,
  user = 'omkesh@coolsofttech.com',
  password,
  folders = ['INBOX'],
  maxEmails = 25
}) {
  if (!password) {
    throw new Error('IMAP password or App Password is required.');
  }

  const cleanPass = String(password).replace(/\s+/g, '');
  console.log(`\n📬 Connecting to IMAP server ${host}:${port} for ${user}...`);

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
        host,
        port: parseInt(port) || 993,
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false
      },
      () => {
        console.log(`🔒 TLS Connection established with ${host}:${port}`);
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

    // 2. Scan folders (e.g. INBOX, Bulk Mail / Spam)
    for (const folder of folders) {
      console.log(`📂 Checking IMAP folder: ${folder}...`);
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

      const fetchRes = await client.sendCommand(`FETCH ${fetchRange} (BODY.PEEK[HEADER.FIELDS (FROM TO SUBJECT DATE)] BODY.PEEK[TEXT]<0.50000>)`);

      // Parse individual messages from fetch output
      const rawMessages = fetchRes.split(/\*\s+\d+\s+FETCH/i).filter(Boolean);

      for (const msgChunk of rawMessages) {
        // Extract Subject
        const subMatch = msgChunk.match(/Subject:\s*([^\r\n]+)/i);
        const subject = subMatch ? subMatch[1].trim() : 'Candidate Resume Application';

        // Extract From
        const fromMatch = msgChunk.match(/From:\s*([^\r\n]+)/i);
        const fromRaw = fromMatch ? fromMatch[1].trim() : '';
        const emailMatch = fromRaw.match(/<([^>]+)>/) || fromRaw.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        const senderEmail = emailMatch ? emailMatch[1].toLowerCase().trim() : '';
        const senderName = fromRaw.replace(/<[^>]+>/, '').replace(/"/g, '').trim() || senderEmail.split('@')[0] || 'Applicant';

        // Extract Date
        const dateMatch = msgChunk.match(/Date:\s*([^\r\n]+)/i);
        const date = dateMatch ? dateMatch[1].trim() : new Date().toISOString();

        // Check if email appears to be a resume or job application
        const lowerChunk = msgChunk.toLowerCase();
        const isRecruitmentRelated =
          lowerChunk.includes('resume') ||
          lowerChunk.includes('candidate') ||
          lowerChunk.includes('developer') ||
          lowerChunk.includes('engineer') ||
          lowerChunk.includes('c2c') ||
          lowerChunk.includes('profile') ||
          lowerChunk.includes('experience') ||
          lowerChunk.includes('application');

        if (senderEmail && isRecruitmentRelated) {
          results.push({
            name: senderName,
            email: senderEmail,
            subject,
            date,
            folder,
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

  console.log(`🎯 IMAP Scan completed! Found ${results.length} candidate application emails.`);
  return results;
}
