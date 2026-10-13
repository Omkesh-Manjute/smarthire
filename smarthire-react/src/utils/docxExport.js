import JSZip from 'jszip'

/**
 * docxExport.js — Genuine Microsoft Word (.docx) & RTF (.doc) Generator
 * 
 * Converts formatted HTML resumes into standard Office Open XML (.docx) binary files
 * and Rich Text Format (.doc) documents with native tables, typography, and bullet points.
 * 
 * Works 100% client-side without external cloud dependencies.
 * Fully compatible with Microsoft Word, Apple Pages, Google Docs, LibreOffice, and Apple TextEdit.
 */

function escapeXml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Converts formatted HTML to WordprocessingML (<w:p>, <w:tbl>, <w:r>, etc.)
 */
function convertHtmlToWordprocessingML(html, options = {}) {
  let xml = ''

  // 1. Strip script, style, comments, and doctypes
  let cleanHtml = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<html[\s\S]*?<body[^>]*>/gi, '')
    .replace(/<\/body>[\s\S]*?<\/html>/gi, '')

  // 2. Parse structural blocks: table, ul, ol, h1-h4, p, div
  const blockRegex = /<(table|ul|ol|h[1-4]|p|div)(?:\s+[^>]*)?>([\s\S]*?)<\/\1>/gi
  let match

  while ((match = blockRegex.exec(cleanHtml)) !== null) {
    const tag = match[1].toLowerCase()
    const innerHtml = match[2]

    if (tag === 'table') {
      xml += '<w:tbl><w:tblPr>'
      xml += '<w:tblW w:w="9600" w:type="dxa"/>'
      xml += '<w:tblBorders>'
      xml += '<w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>'
      xml += '<w:left w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>'
      xml += '<w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>'
      xml += '<w:right w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>'
      xml += '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
      xml += '<w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
      xml += '</w:tblBorders></w:tblPr>'

      const trRegex = /<tr(?:\s+[^>]*)?>([\s\S]*?)<\/tr>/gi
      let trMatch
      let isFirstRow = true

      while ((trMatch = trRegex.exec(innerHtml)) !== null) {
        xml += '<w:tr>'
        const cellRegex = /<(td|th)(?:\s+[^>]*)?>([\s\S]*?)<\/\1>/gi
        let cellMatch
        let colIndex = 0

        while ((cellMatch = cellRegex.exec(trMatch[1])) !== null) {
          const isTh = cellMatch[1].toLowerCase() === 'th' || isFirstRow
          const rawCell = cellMatch[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
          const colWidth = colIndex === 0 ? '2800' : '6800'
          const bgFill = isTh ? 'F1F5F9' : (colIndex === 0 ? 'F8FAFC' : 'FFFFFF')

          xml += '<w:tc><w:tcPr>'
          xml += '<w:tcW w:w="' + colWidth + '" w:type="dxa"/>'
          xml += '<w:shd w:val="clear" w:color="auto" w:fill="' + bgFill + '"/>'
          xml += '<w:tcMar><w:top w:w="120" w:type="dxa"/><w:left w:w="160" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:right w:w="160" w:type="dxa"/></w:tcMar>'
          xml += '</w:tcPr>'
          xml += '<w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>'
          xml += '<w:r><w:rPr>'
          if (isTh || colIndex === 0) xml += '<w:b/>'
          xml += '<w:sz w:val="' + (isTh ? '20' : '19') + '"/>'
          xml += '<w:color w:val="' + (isTh ? '0F172A' : (colIndex === 0 ? '1E293B' : '0F172A')) + '"/>'
          xml += '</w:rPr><w:t xml:space="preserve">' + escapeXml(rawCell) + '</w:t></w:r></w:p></w:tc>'
          colIndex++
        }
        xml += '</w:tr>'
        isFirstRow = false
      }
      xml += '</w:tbl>'
      xml += '<w:p><w:r><w:t></w:t></w:r></w:p>'
    } else if (tag === 'ul' || tag === 'ol') {
      const liRegex = /<li(?:\s+[^>]*)?>([\s\S]*?)<\/li>/gi
      let liMatch
      while ((liMatch = liRegex.exec(innerHtml)) !== null) {
        const rawLi = liMatch[1].replace(/&nbsp;/g, ' ').trim()
        xml += '<w:p><w:pPr><w:ind w:left="360"/><w:spacing w:after="60" w:line="240" w:lineRule="auto"/></w:pPr>'
        xml += '<w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>• </w:t></w:r>'
        xml += parseInlineRuns(rawLi, '20')
        xml += '</w:p>'
      }
    } else if (tag.startsWith('h')) {
      const hText = innerHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const sz = tag === 'h1' ? '32' : (tag === 'h2' ? '26' : '22')
      const color = tag === 'h1' ? '0F172A' : (tag === 'h2' ? '1E293B' : '2563EB')
      xml += '<w:p><w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr>'
      xml += '<w:r><w:rPr><w:b/><w:sz w:val="' + sz + '"/><w:color w:val="' + color + '"/></w:rPr><w:t>' + escapeXml(hText) + '</w:t></w:r></w:p>'
    } else {
      // p or div
      const clean = innerHtml.replace(/&nbsp;/g, ' ').trim()
      if (!clean) continue
      if (clean === '<br>' || clean === '<br/>') {
        xml += '<w:p><w:r><w:t></w:t></w:r></w:p>'
        continue
      }
      xml += '<w:p><w:pPr><w:spacing w:after="80" w:line="260" w:lineRule="auto"/></w:pPr>'
      xml += parseInlineRuns(clean, '21')
      xml += '</w:p>'
    }
  }

  // If no block tags matched (plain text), split by lines
  if (!xml.trim()) {
    const lines = cleanHtml.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    for (const l of lines) {
      xml += '<w:p><w:pPr><w:spacing w:after="80"/></w:pPr>'
      xml += '<w:r><w:rPr><w:sz w:val="21"/></w:rPr><w:t>' + escapeXml(l) + '</w:t></w:r></w:p>'
    }
  }

  return xml
}

function parseInlineRuns(htmlSnippet, defaultSz = '20') {
  let runs = ''
  const tokens = htmlSnippet.split(/(<b(?:\s+[^>]*)?>[\s\S]*?<\/b>|<strong(?:\s+[^>]*)?>[\s\S]*?<\/strong>|<u(?:\s+[^>]*)?>[\s\S]*?<\/u>|<i(?:\s+[^>]*)?>[\s\S]*?<\/i>|<span(?:\s+[^>]*)?>[\s\S]*?<\/span>|<a(?:\s+[^>]*)?>[\s\S]*?<\/a>)/gi)

  for (const tok of tokens) {
    if (!tok) continue
    const isBold = /^<(b|strong)/i.test(tok)
    const isUnderline = /^<u/i.test(tok)
    const isItalic = /^<i/i.test(tok)
    const cleanText = tok.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')
    if (!cleanText) continue

    runs += '<w:r><w:rPr>'
    if (isBold) runs += '<w:b/>'
    if (isUnderline) runs += '<w:u w:val="single"/>'
    if (isItalic) runs += '<w:i/>'
    runs += '<w:sz w:val="' + defaultSz + '"/>'
    runs += '<w:color w:val="0F172A"/>'
    runs += '</w:rPr><w:t xml:space="preserve">' + escapeXml(cleanText) + ' </w:t></w:r>'
  }

  return runs
}

/**
 * Generates a genuine Microsoft Word (.docx) file as a Blob using JSZip
 */
export async function generateWordDocxBlob(htmlContent, candidateName = 'Candidate') {
  const zip = new JSZip()

  // 1. [Content_Types].xml
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`)

  // 2. _rels/.rels
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`)

  // 3. word/document.xml
  const bodyXml = convertHtmlToWordprocessingML(htmlContent, { candidateName })
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/>
    </w:sectPr>
  </w:body>
</w:document>`

  zip.file('word/document.xml', documentXml)

  // Generate binary docx blob
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  })

  return blob
}

/**
 * Generates an RTF-based .doc file that opens with styled formatting in macOS TextEdit and Microsoft Word
 */
export function generateWordRtfBlob(htmlContent, candidateName = 'Candidate') {
  let rtf = '{\\rtf1\\ansi\\deff0\\nouicompat{\\fonttbl{\\f0\\fnil\\fcharset0 Calibri;}{\\f1\\fnil\\fcharset0 Arial;}}\n'
  rtf += '{\\colortbl ;\\red15\\green23\\blue42;\\red37\\green99\\blue235;\\red100\\green116\\blue139;}\n'
  rtf += '\\viewkind4\\uc1\\pard\\sa160\\sl276\\slmult1\\f0\\fs22\n'

  // Clean html tags for rtf
  const lines = htmlContent
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<table[^>]*>/gi, '\n--- SKILLS TABLE ---\n')
    .replace(/<\/table>/gi, '\n--- END TABLE ---\n')
    .replace(/<tr[^>]*>/gi, '\n')
    .replace(/<\/tr>/gi, '')
    .replace(/<td[^>]*>/gi, ' • ')
    .replace(/<\/td>/gi, ' ')
    .replace(/<th[^>]*>/gi, ' [')
    .replace(/<\/th>/gi, '] ')
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\\fs32\\b $1\\b0\\fs22\\par\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\\fs26\\b $1\\b0\\fs22\\par\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\\fs24\\b $1\\b0\\fs22\\par\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\\par\n')
    .replace(/<li[^>]*>/gi, '  • ')
    .replace(/<\/li>/gi, '\\par\n')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '\\b $1\\b0 ')
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '\\b $1\\b0 ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

  rtf += lines.split('\n').map(l => l.trim()).filter(Boolean).join('\\par\n')
  rtf += '\n}'

  return new Blob([rtf], { type: 'application/rtf;charset=utf-8' })
}

/**
 * Triggers browser download for a Blob
 */
export function triggerFileDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
