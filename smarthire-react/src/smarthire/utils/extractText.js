import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export async function extractText(file) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return extractPdfText(file);
  else if (ext === "docx") return extractDocxText(file);
  else if (ext === "txt") return file.text();
  return "";
}

async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let lastY = null;
    let pageText = "";
    for (const item of content.items) {
      const str = item.str;
      if (typeof str === "undefined") continue;
      const y = item.transform?.[5];
      if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 5) {
        pageText += "\n";
      } else if (pageText && !pageText.endsWith("\n") && !pageText.endsWith(" ") && !str.startsWith(" ")) {
        pageText += " ";
      }
      pageText += str;
      if (y !== undefined) lastY = y;
      if (item.hasEOL && !pageText.endsWith("\n")) {
        pageText += "\n";
        lastY = null;
      }
    }
    fullText += pageText + "\n";
  }
  return fullText;
}

async function extractDocxText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
