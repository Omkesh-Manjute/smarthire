/**
 * MIME Parser & Attachment Extraction Engine for SmartHire ATS
 * Decodes multipart RFC822 / IMAP messages, extracts clean text bodies,
 * and extracts binary buffers for PDF, DOCX, and image compliance attachments (DL, Visa, ID).
 */

function decodeHeaderValue(str) {
  if (!str) return '';
  let cleaned = str.replace(/[\r\n\t]+/g, ' ').trim();
  // Handle RFC2047 encoded-words: =?charset?encoding?encoded_text?=
  if (cleaned.includes('=?')) {
    cleaned = cleaned.replace(/=\?([^?]+)\?([QB])\?([^?]+)\?=/gi, (match, charset, enc, text) => {
      try {
        if (enc.toUpperCase() === 'B') {
          return Buffer.from(text, 'base64').toString(charset.toLowerCase().includes('utf') ? 'utf8' : 'latin1');
        } else if (enc.toUpperCase() === 'Q') {
          const qText = text.replace(/_/g, ' ').replace(/=([A-F0-9]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
          return Buffer.from(qText, 'latin1').toString('utf8');
        }
      } catch (e) {}
      return match;
    });
  }
  // Handle RFC2231 encoding e.g. UTF-8''filename.pdf
  if (cleaned.toLowerCase().includes("utf-8''")) {
    const parts = cleaned.split(/utf-8''/i);
    try {
      cleaned = decodeURIComponent(parts[1]);
    } catch (_) {}
  }
  return cleaned.replace(/^["']|["']$/g, '').trim();
}

function decodeQuotedPrintable(text) {
  if (!text) return '';
  return text
    .replace(/=\r?\n/g, '')
    .replace(/=C2=A0/gi, ' ')
    .replace(/=E2=80=99/gi, "'")
    .replace(/=E2=80=9C/gi, '"')
    .replace(/=E2=80=9D/gi, '"')
    .replace(/=E2=80=93/gi, '-')
    .replace(/=3D/gi, '=')
    .replace(/=([A-F0-9]{2})/gi, (_, hex) => {
      try { return String.fromCharCode(parseInt(hex, 16)); } catch(e) { return ''; }
    });
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"');
}

/**
 * Classify document into ATS document category based on filename & context
 */
export function classifyDocCategory(filename = '', existingCategories = []) {
  const fn = String(filename || '').toLowerCase().trim();

  // 1. Driver's License Front & Back
  if (fn.match(/(?:dl[_\s-]*front|driver[_\s-]*license[_\s-]*front|front[_\s-]*dl)/i)) return 'dlFront';
  if (fn.match(/(?:dl[_\s-]*back|driver[_\s-]*license[_\s-]*back|back[_\s-]*dl)/i)) return 'dlBack';
  if (fn.match(/(?:dl\b|driver[_\s-]*license|lcn\b|driving[_\s-]*license)/i)) {
    return existingCategories.includes('dlFront') ? 'dlBack' : 'dlFront';
  }

  // 2. Visa & Work Authorization
  if (fn.match(/(?:visa|h1b|h-1b|i-?797|ead|greencard|green[_\s-]*card|gc\b|work[_\s-]*auth|opt\b|cpt\b)/i)) {
    return 'visa';
  }

  // 3. Government Photo ID / Passport
  if (fn.match(/(?:passport|govt[_\s-]*id|state[_\s-]*id|national[_\s-]*id|photo[_\s-]*id|identity|ssn)/i)) {
    return 'id';
  }

  // 4. Resume / CV - In recruitment inbox, every attached document (.pdf, .docx, .doc) is a candidate resume
  if (fn.match(/\.(pdf|docx?|doc)$/i)) {
    return 'resume';
  }

  return 'other';
}

/**
 * Extract all MIME parts from a raw email string (handling nested boundaries)
 */
function extractAllParts(raw) {
  if (!raw) return [];

  // Find all boundaries declared anywhere in the raw text
  const boundaryMatches = [...raw.matchAll(/boundary=["']?([^"';\r\n]+)["']?/gi)].map(m => m[1].replace(/["']/g, '').trim());
  const uniqueBoundaries = [...new Set(boundaryMatches)].filter(Boolean);

  if (uniqueBoundaries.length === 0) {
    // Single-part message
    const headerEnd = raw.search(/\r?\n\r?\n/);
    if (headerEnd !== -1) {
      return [{
        headers: raw.slice(0, headerEnd),
        body: raw.slice(headerEnd).trim()
      }];
    }
    return [{ headers: '', body: raw }];
  }

  // Recursive splitter
  let segments = [raw];
  for (const b of uniqueBoundaries) {
    const escaped = b.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const newSegments = [];
    for (const seg of segments) {
      const splitParts = seg.split(new RegExp('--' + escaped));
      for (const p of splitParts) {
        const trimmed = p.replace(/^--\r?\n?$/, '').trim();
        if (trimmed && trimmed !== '--') {
          newSegments.push(trimmed);
        }
      }
    }
    segments = newSegments;
  }

  const result = [];
  for (const seg of segments) {
    const headerEnd = seg.search(/\r?\n\r?\n/);
    if (headerEnd !== -1) {
      result.push({
        headers: seg.slice(0, headerEnd),
        body: seg.slice(headerEnd).trim()
      });
    } else {
      result.push({
        headers: '',
        body: seg.trim()
      });
    }
  }

  return result;
}

/**
 * Parse raw MIME message into text body, attachment names list, and decoded binary attachment buffers
 */
export function parseMimeWithAttachments(raw) {
  if (!raw) {
    return { textBody: '', attachmentNames: [], attachments: [] };
  }

  const rawStr = typeof raw === 'string' ? raw : raw.toString('utf8');
  const parts = extractAllParts(rawStr);

  const attachments = [];
  const attachmentNames = [];
  let textPlainCandidates = [];
  let textHtmlCandidates = [];

  for (const part of parts) {
    const headers = part.headers || '';
    const body = part.body || '';

    // Extract headers
    const contentTypeMatch = headers.match(/Content-Type:\s*([^;\r\n]+)/i);
    const contentType = contentTypeMatch ? contentTypeMatch[1].toLowerCase().trim() : 'text/plain';

    const encodingMatch = headers.match(/Content-Transfer-Encoding:\s*([^\r\n;]+)/i);
    const encoding = encodingMatch ? encodingMatch[1].toLowerCase().trim() : '7bit';

    const dispositionMatch = headers.match(/Content-Disposition:\s*([^;\r\n]+)/i);
    const isAttachmentDisposition = dispositionMatch ? dispositionMatch[1].toLowerCase().trim() === 'attachment' : false;

    // Detect filename in Content-Disposition or Content-Type
    const fnMatch = headers.match(/(?:filename|name)=["']?([^"'\r\n;]+)["']?/i) ||
                    headers.match(/filename\*=([^;\r\n]+)/i);
    let filename = fnMatch ? decodeHeaderValue(fnMatch[1]) : '';

    // Clean up quotes/spaces
    if (filename) {
      filename = filename.replace(/^["']|["']$/g, '').trim();
    }

    const isBinaryType = contentType.includes('pdf') ||
                         contentType.includes('msword') ||
                         contentType.includes('wordprocessingml') ||
                         contentType.includes('image/') ||
                         contentType.includes('octet-stream');

    const hasFileExt = /\.(pdf|docx?|doc|png|jpe?g|webp|gif|bmp|tiff?)$/i.test(filename);

    if (isAttachmentDisposition || hasFileExt || (isBinaryType && filename)) {
      // It's an attachment!
      let cleanFn = filename || `attachment_${attachments.length + 1}${contentType.includes('pdf') ? '.pdf' : '.bin'}`;
      if (!attachmentNames.includes(cleanFn)) {
        attachmentNames.push(cleanFn);
      }

      let contentBuffer = null;
      if (encoding === 'base64') {
        // Strip whitespace and decode Base64
        const cleanB64 = body.replace(/[\r\n\t\s]+/g, '');
        try {
          contentBuffer = Buffer.from(cleanB64, 'base64');
        } catch (_) {
          contentBuffer = Buffer.from(body, 'utf8');
        }
      } else if (encoding === 'quoted-printable') {
        const decoded = decodeQuotedPrintable(body);
        contentBuffer = Buffer.from(decoded, 'utf8');
      } else {
        contentBuffer = Buffer.from(body, 'utf8');
      }

      const existingCats = attachments.map(a => a.docCategory);
      const category = classifyDocCategory(cleanFn, existingCats);

      attachments.push({
        filename: cleanFn,
        contentType: contentType || 'application/octet-stream',
        encoding,
        content: contentBuffer,
        size: contentBuffer ? contentBuffer.length : 0,
        docCategory: category
      });
    } else {
      // It's a text part
      let decodedText = body;
      if (encoding === 'base64') {
        try {
          const cleanB64 = body.replace(/[\r\n\t\s]+/g, '');
          decodedText = Buffer.from(cleanB64, 'base64').toString('utf8');
        } catch (_) {}
      } else if (encoding === 'quoted-printable') {
        decodedText = decodeQuotedPrintable(body);
      }

      if (contentType.includes('text/plain')) {
        textPlainCandidates.push(decodedText);
      } else if (contentType.includes('text/html')) {
        textHtmlCandidates.push(stripHtml(decodedText));
      }
    }
  }

  // Choose best body text
  let chosenText = '';
  if (textPlainCandidates.length > 0) {
    chosenText = textPlainCandidates.join('\n\n');
  } else if (textHtmlCandidates.length > 0) {
    chosenText = textHtmlCandidates.join('\n\n');
  } else {
    // Fallback: search for header separator
    const headerEnd = rawStr.search(/\r?\n\r?\n/);
    chosenText = headerEnd !== -1 ? rawStr.slice(headerEnd).trim() : rawStr;
    chosenText = stripHtml(decodeQuotedPrintable(chosenText));
  }

  // Clean lines: strip leftover Base64 blocks, MIME headers, boundary delimiters
  const lines = chosenText.split(/\r?\n/);
  const cleanLines = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    if (trimmed.length > 30 && !trimmed.includes(' ') && /^[A-Za-z0-9+/=]+$/.test(trimmed)) {
      return false;
    }
    if (/^(Content-Type|Content-Disposition|Content-Transfer-Encoding|Content-ID|X-Attachment-Id):/i.test(trimmed)) {
      return false;
    }
    if (/^--[a-zA-Z0-9_.-]+--?$/.test(trimmed)) {
      return false;
    }
    if (/^BODY\[TEXT\]/i.test(trimmed) || /^TAG\d+\s+OK/i.test(trimmed)) {
      return false;
    }
    return true;
  });

  const textBody = cleanLines.join('\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  // Also scan rawStr for any filename patterns in case attachment headers were embedded
  if (attachmentNames.length === 0) {
    const attachMatches = rawStr.matchAll(/(?:filename|name)=["']?([^"'\r\n;]+)["']?/gi);
    for (const m of attachMatches) {
      const fn = decodeHeaderValue(m[1]);
      if (fn.toLowerCase().endsWith('.pdf') || fn.toLowerCase().endsWith('.doc') || fn.toLowerCase().endsWith('.docx') || fn.toLowerCase().endsWith('.png') || fn.toLowerCase().endsWith('.jpg')) {
        if (!attachmentNames.includes(fn)) attachmentNames.push(fn);
      }
    }
  }

  return {
    textBody,
    attachmentNames,
    attachments
  };
}

/**
 * Backwards compatible export for legacy callers
 */
export function cleanMimeEmail(raw) {
  const result = parseMimeWithAttachments(raw);
  return {
    textBody: result.textBody,
    attachmentNames: result.attachmentNames,
    attachments: result.attachments
  };
}

