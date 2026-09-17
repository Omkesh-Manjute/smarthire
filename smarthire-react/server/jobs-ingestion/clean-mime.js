export function cleanMimeEmail(raw) {
  let attachmentNames = [];
  if (!raw) return { textBody: '', attachmentNames: [] };

  // 1. Detect attachments
  const attachMatches = raw.matchAll(/(?:filename|name)=["']?([^"'\r\n;]+)["']?/gi);
  for (const m of attachMatches) {
    const fn = m[1].trim();
    if (fn.toLowerCase().endsWith('.pdf') || fn.toLowerCase().endsWith('.doc') || fn.toLowerCase().endsWith('.docx')) {
      if (!attachmentNames.includes(fn)) attachmentNames.push(fn);
    }
  }

  // 2. Separate parts by boundary if multipart
  const boundaryMatch = raw.match(/boundary=["']?([^"'\r\n;]+)["']?/i);
  let textBody = '';

  if (boundaryMatch) {
    const boundary = boundaryMatch[1].replace(/["']/g, '');
    const escaped = boundary.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const parts = raw.split(new RegExp('--' + escaped));
    
    // Look for text/plain part first
    for (const part of parts) {
      if (/Content-Type:\s*text\/plain/i.test(part)) {
        const bodyStart = part.search(/\r?\n\r?\n/);
        if (bodyStart !== -1) {
          textBody = part.slice(bodyStart).trim();
          break;
        }
      }
    }
    // If no text/plain, look for text/html
    if (!textBody) {
      for (const part of parts) {
        if (/Content-Type:\s*text\/html/i.test(part)) {
          const bodyStart = part.search(/\r?\n\r?\n/);
          if (bodyStart !== -1) {
            textBody = part.slice(bodyStart).trim();
            break;
          }
        }
      }
    }
  }

  if (!textBody) {
    const headerEndMatch = raw.search(/\r?\n\r?\n/);
    textBody = headerEndMatch !== -1 ? raw.slice(headerEndMatch).trim() : raw;
  }

  // 3. Clean Quoted-Printable
  textBody = textBody
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

  // 4. Strip HTML tags
  textBody = textBody
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"');

  // 5. Strip any base64 lines, MIME header remnants, or boundaries
  const lines = textBody.split(/\r?\n/);
  const cleanLines = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    // Base64 line filter
    if (trimmed.length > 30 && !trimmed.includes(' ') && /^[A-Za-z0-9+/=]+$/.test(trimmed)) {
      return false;
    }
    // MIME header filter
    if (/^(Content-Type|Content-Disposition|Content-Transfer-Encoding|Content-ID|X-Attachment-Id):/i.test(trimmed)) {
      return false;
    }
    // Boundary filter
    if (/^--[a-zA-Z0-9_-]+--?$/.test(trimmed)) {
      return false;
    }
    // IMAP wrapper tag
    if (/^BODY\[TEXT\]/i.test(trimmed)) {
      return false;
    }
    return true;
  });

  textBody = cleanLines.join('\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  return { textBody, attachmentNames };
}
