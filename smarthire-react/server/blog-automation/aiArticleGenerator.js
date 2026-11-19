// ─────────────────────────────────────────────────────────────────────────────
// AI ARTICLE GENERATOR ENGINE (GROQ 120B / OPENAI COMPATIBLE)
// ─────────────────────────────────────────────────────────────────────────────

import https from 'https';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded dynamically from multiple search paths
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: '/home/ubuntu/smarthire/.env' });

const SYSTEM_PROMPT = `You are the Lead Editorial Director and Chief Research Strategist for SmartHire Publication (smarthireus.com), a premier US IT recruitment, staffing intelligence, and talent platform.

Your task is to write a deeply researched, comprehensive, 100% unique, authoritative, and actionable long-form editorial article (1,400 to 1,800 words) for tech professionals, hiring managers, and IT contractors.

CRITICAL SEO & EDITORIAL GUIDELINES (TARGET: 95+ SEO SCORE):
1. Voice & Tone: Highly authoritative, empirical, analytical, and professional (like The Wall Street Journal Tech, Harvard Business Review, or O'Reilly Radar). Avoid fluff, generic cliches, or marketing buzzwords.
2. Structure & Semantics:
   - Use clean, semantic HTML formatting within the "contentHtml" field.
   - Use <h2> for main topics, <h3> for sub-topics.
   - Include at least ONE rich HTML comparison table (<table><thead><tr><th>...</th></tr></thead><tbody>...</tbody></table>) containing authentic compensation data, tax comparisons, or skill matrix comparisons.
   - Include bulleted lists (<ul><li>...</li></ul>) for actionable takeaways.
   - Include an Executive Takeaways callout box at the start.
   - Include a dedicated FAQ section with 3-4 frequently asked questions with in-depth answers.
   - Include a natural contextual Call to Action (CTA) pointing to SmartHire's direct-client job portal (https://smarthireus.com/jobs) for candidates looking for verified C2C/W2 requisitions.
3. Strict Ban on Emojis & Raw Decorative Symbols: Never include decorative emojis or symbols in headers, subheadings, tables, callouts, or buttons. Keep it strictly institutional, crisp, enterprise B2B corporate polish.
4. Output Format: Return a STRICT JSON object with no preamble or trailing conversational text.

The JSON schema must be:
{
  "title": "string (Compelling, clear H1 title, ~60 chars)",
  "slug": "string (kebab-case URL slug matching the title)",
  "metaTitle": "string (High-CTR SEO Title under 60 characters with primary keyword and | SmartHire)",
  "metaDescription": "string (Compelling search meta description under 160 characters summarizing the article)",
  "excerpt": "string (2-3 sentence overview highlighting the key problem and empirical findings)",
  "category": "string (Category name: AI & Emerging Tech / Company & Enterprise Staffing / Visas & Compliance / Contracting & Rates / Cloud & Data Infrastructure / ATS & Technical Interviewing)",
  "readTime": "string (e.g. '8 min read')",
  "tags": ["array", "of", "6-8", "targeted", "seo", "tags"],
  "caption": "string (Photographic editorial caption describing the hero image)",
  "imagePrompt": "string (Photorealistic, ultra-detailed prompt for AI image generation, describing a modern corporate enterprise IT setting, server room, architectural tech workspace, or clean data visualization, without text or watermarks)",
  "contentHtml": "string (Complete, deep, 1,400+ words HTML article content with h2, h3, p, table, ul, li, blockquote, callouts)"
}`;

export async function generateArticleWithAI(topicMeta) {
  const { title, seedAngle, category, tags, suggestedSlug } = topicMeta;
  const groqApiKey = (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() && !process.env.GROQ_API_KEY.includes('your_'))
    ? process.env.GROQ_API_KEY.trim()
    : '';

  if (!groqApiKey) {
    throw new Error('Groq API Key is not configured. Please set GROQ_API_KEY in your .env configuration.');
  }

  const groqModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

  const userPrompt = `Write a comprehensive, deep, authoritative editorial article on the following topic:

TOPIC TITLE: "${title}"
CATEGORY: "${category}"
CORE ANGLE & SCOPE: ${seedAngle}
SUGGESTED SLUG: "${suggestedSlug || ''}"
TARGET AUDIENCE: US IT contractors, enterprise hiring managers, technical recruiters, software engineers, and cloud architects.

Provide real salary numbers, C2C hourly rates, practical comparisons, tax math, or enterprise hiring workflows as relevant. Return the response as valid JSON matching the exact specified schema.`;

  const requestBody = JSON.stringify({
    model: groqModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.25,
    max_tokens: 4500
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.groq.com',
      port: 443,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Length': Buffer.byteLength(requestBody)
      },
      timeout: 60000
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        try {
          const rawText = Buffer.concat(chunks).toString('utf-8');
          const data = JSON.parse(rawText);
          if (data.error) {
            return reject(new Error(`Groq API Error: ${data.error.message}`));
          }
          const contentStr = data.choices?.[0]?.message?.content;
          if (!contentStr) {
            return reject(new Error('Empty content returned by Groq'));
          }
          const parsedArticle = JSON.parse(contentStr);
          
          // Ensure mandatory fields
          parsedArticle.slug = (parsedArticle.slug || suggestedSlug || title)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 80);

          parsedArticle.author = 'SmartHire Editorial Team';
          parsedArticle.authorRole = 'Technical Recruiting Research Group';
          parsedArticle.authorBio = 'The SmartHire Editorial Research Group curates empirical hiring trends, compensation datasets, and talent benchmarks across direct-client US enterprise staffing.';
          parsedArticle.date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          parsedArticle.publishedAt = new Date().toISOString();

          resolve(parsedArticle);
        } catch (err) {
          reject(new Error(`Failed to parse article JSON from Groq: ${err.message}`));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`Groq connection error: ${err.message}`)));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Groq request timed out after 60 seconds'));
    });

    req.write(requestBody);
    req.end();
  });
}
