import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

import { authenticate, requireSuperAdmin } from '../middleware/auth.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Enforce Super Admin permissions for all LinkedIn / Social automation endpoints
router.use(authenticate, requireSuperAdmin);

// Path to the LinkedIn posts pipeline directory
const PIPELINE_DIR = process.env.LINKEDIN_PIPELINE_DIR || 'E:/daily-linkedin-posts-pipeline';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_PIPELINE || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID_PIPELINE || '';

function getPipelineDir() {
  return PIPELINE_DIR;
}

function getLatestPostFile(dir) {
  try {
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith('linkedin_posts_') && f.endsWith('.txt') && f !== 'linkedin_posts_today.txt')
      .sort()
      .reverse();
    if (files.length > 0) {
      const compact = files[0].replace('linkedin_posts_', '').replace('.txt', '');
      return { compact, isoDate: `${compact.slice(0,4)}-${compact.slice(4,6)}-${compact.slice(6,8)}` };
    }
  } catch (e) {}
  // fallback to today
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return { compact: `${y}${m}${d}`, isoDate: `${y}-${m}-${d}` };
}

function getLatestInfographicCompact(dir) {
  try {
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith('linkedin-infographic-') && f.endsWith('.png'))
      .sort()
      .reverse();
    if (files.length > 0) {
      const m = files[0].match(/linkedin-infographic-(\d{8})\.png/);
      if (m) return m[1];
    }
  } catch (e) {}
  return null;
}

function getLatestCarouselDate(dir) {
  try {
    const outputDir = path.join(dir, 'carousel-routine', 'output');
    if (fs.existsSync(outputDir)) {
      const dirs = fs.readdirSync(outputDir)
        .filter(d => fs.statSync(path.join(outputDir, d)).isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d))
        .sort()
        .reverse();
      if (dirs.length > 0) return dirs[0];
    }
  } catch (e) {}
  return null;
}

function getTodayCompact() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function getTodayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parsePosts(content) {
  const posts = {};
  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const sections = normalized.split(/={10,}/);
  
  for (let i = 0; i < sections.length - 1; i++) {
    const header = sections[i].trim();
    const body = sections[i + 1] ? sections[i + 1].trim() : '';
    if (header && body && /^\d+\./.test(header)) {
      posts[header] = body;
    }
  }
  return posts;
}

// GET /api/linkedin-posts/today — read today's generated posts
router.get('/today', (req, res) => {
  const dir = getPipelineDir();
  const { compact, isoDate } = getLatestPostFile(dir);

  // Find post text file
  let postFile = path.join(dir, `linkedin_posts_${compact}.txt`);
  if (!fs.existsSync(postFile)) {
    postFile = path.join(dir, 'linkedin_posts_today.txt');
  }

  if (!fs.existsSync(postFile)) {
    return res.status(404).json({ success: false, message: 'No posts generated yet. Run the pipeline first.' });
  }

  const content = fs.readFileSync(postFile, 'utf8');
  const parsed = parsePosts(content);

  // Check for infographic image (dynamic latest)
  const infoCompact = getLatestInfographicCompact(dir) || compact;
  const infographicPng = path.join(dir, `linkedin-infographic-${infoCompact}.png`);
  const hasInfographic = fs.existsSync(infographicPng);

  // Check for carousel slides (dynamic latest)
  const latestCarouselDate = getLatestCarouselDate(dir) || isoDate;
  const carouselDir = path.join(dir, 'carousel-routine', 'output', latestCarouselDate, 'carousel-branded');
  const carouselSlides = [];
  if (fs.existsSync(carouselDir)) {
    const files = fs.readdirSync(carouselDir).filter(f => f.startsWith('slide-') && f.endsWith('.png'));
    files.sort();
    for (const f of files) {
      carouselSlides.push(`/api/linkedin-posts/slide/${latestCarouselDate}/${f}`);
    }
  }

  // Check carousel PDF
  const carouselPdf = path.join(carouselDir, 'startup-strategy-carousel.pdf');
  const hasCarouselPdf = fs.existsSync(carouselPdf);

  // Read status file if exists
  const statusFile = path.join(dir, `approval_status_${compact}.json`);
  let approvalStatus = 'pending';
  if (fs.existsSync(statusFile)) {
    try {
      const statusData = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
      approvalStatus = statusData.status || 'pending';
    } catch (e) {}
  }

  res.json({
    success: true,
    date: isoDate,
    approvalStatus,
    posts: {
      collaborativeArticle: parsed['1. COLLABORATIVE ARTICLE'] || null,
      carousel: parsed['2. CAROUSEL'] || null,
      infographic: parsed['3. INFOGRAPHIC'] || null,
    },
    assets: {
      infographicUrl: hasInfographic ? `/api/linkedin-posts/infographic/${infoCompact}` : null,
      carouselSlides,
      carouselPdfUrl: hasCarouselPdf ? `/api/linkedin-posts/pdf/${latestCarouselDate}` : null,
    }
  });
});

// GET /api/linkedin-posts/infographic/:date — serve infographic PNG
router.get('/infographic/:date', (req, res) => {
  const { date } = req.params;
  const imgPath = path.join(getPipelineDir(), `linkedin-infographic-${date}.png`);
  if (!fs.existsSync(imgPath)) {
    return res.status(404).json({ success: false, message: 'Infographic not found' });
  }
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  fs.createReadStream(imgPath).pipe(res);
});

// GET /api/linkedin-posts/slide/:date/:filename — serve carousel slide PNG
router.get('/slide/:date/:filename', (req, res) => {
  const { date, filename } = req.params;
  const slidePath = path.join(
    getPipelineDir(),
    'carousel-routine', 'output', date, 'carousel-branded', filename
  );
  if (!fs.existsSync(slidePath)) {
    return res.status(404).json({ success: false, message: 'Slide not found' });
  }
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  fs.createReadStream(slidePath).pipe(res);
});

// GET /api/linkedin-posts/pdf/:date — serve carousel PDF
router.get('/pdf/:date', (req, res) => {
  const { date } = req.params;
  const pdfPath = path.join(
    getPipelineDir(),
    'carousel-routine', 'output', date, 'carousel-branded', 'startup-strategy-carousel.pdf'
  );
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ success: false, message: 'PDF not found' });
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="carousel.pdf"');
  fs.createReadStream(pdfPath).pipe(res);
});

// POST /api/linkedin-posts/approve — trigger Telegram approval notification
router.post('/approve', (req, res) => {
  const compact = getTodayCompact();
  const statusFile = path.join(getPipelineDir(), `approval_status_${compact}.json`);

  // Save approved status
  fs.writeFileSync(statusFile, JSON.stringify({ status: 'approved', approvedAt: new Date().toISOString() }));

  // Send Telegram confirmation
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    const msg = encodeURIComponent('✅ *APPROVED via Dashboard!* Posts have been approved and will be scheduled on LinkedIn.');
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${msg}&parse_mode=Markdown`;
    https.get(telegramUrl, () => {}).on('error', () => {});
  }

  res.json({ success: true, message: 'Posts approved! Telegram notification sent.' });
});

// POST /api/linkedin-posts/cancel — cancel and notify
router.post('/cancel', (req, res) => {
  const compact = getTodayCompact();
  const statusFile = path.join(getPipelineDir(), `approval_status_${compact}.json`);

  fs.writeFileSync(statusFile, JSON.stringify({ status: 'cancelled', cancelledAt: new Date().toISOString() }));

  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    const msg = encodeURIComponent('❌ *CANCELLED via Dashboard.* No posts will be scheduled today.');
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${msg}&parse_mode=Markdown`;
    https.get(telegramUrl, () => {}).on('error', () => {});
  }

  res.json({ success: true, message: 'Scheduling cancelled.' });
});

export default router;
