// ─────────────────────────────────────────────────────────────────────────────
// BLOG SERVICE & AUTOMATED ORCHESTRATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { selectNextTopic } from './topicDatabase.js';
import { generateArticleWithAI } from './aiArticleGenerator.js';
import { generateHeroImage } from './aiImageGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blogsDbPath = path.resolve(__dirname, '../blogs.json');
let blogsStore = [];

/**
 * Load blogs from blogs.json on disk
 */
export function loadBlogsFromDisk() {
  try {
    if (fs.existsSync(blogsDbPath)) {
      const raw = fs.readFileSync(blogsDbPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        blogsStore = parsed;
        console.log(`[Blog Service] Loaded ${blogsStore.length} blog post(s) from disk.`);
        return blogsStore;
      }
    }
  } catch (err) {
    console.warn('⚠️ [Blog Service] Failed to load blogs from disk:', err.message);
  }
  blogsStore = [];
  return blogsStore;
}

/**
 * Save blogs to blogs.json on disk
 */
export function saveBlogsToDisk() {
  try {
    fs.writeFileSync(blogsDbPath, JSON.stringify(blogsStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('⚠️ [Blog Service] Failed to save blogs to disk:', err.message);
  }
}

/**
 * Returns all active blogs (sorted newest first)
 */
export function getAllBlogs() {
  return [...blogsStore].sort((a, b) => new Date(b.publishedAt || b.date) - new Date(a.publishedAt || a.date));
}

/**
 * Returns single blog by slug or alias
 */
export function getBlogBySlug(slug) {
  if (!slug) return null;
  const cleanSlug = String(slug).toLowerCase().trim();
  return blogsStore.find(b => 
    (b.slug && b.slug.toLowerCase() === cleanSlug) ||
    (Array.isArray(b.aliases) && b.aliases.some(a => a.toLowerCase() === cleanSlug))
  ) || null;
}

/**
 * Generates and writes pre-rendered static HTML file for instant Googlebot indexation
 */
function writePreRenderedHtml(blog) {
  const siteUrl = 'https://smarthireus.com';
  const postUrl = `${siteUrl}/blog/${blog.slug}`;
  const imageUrl = blog.image.startsWith('http') ? blog.image : `${siteUrl}${blog.image}`;

  const ldJson = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.title,
    "description": blog.metaDescription || blog.excerpt,
    "image": imageUrl,
    "datePublished": blog.publishedAt || new Date().toISOString(),
    "dateModified": blog.publishedAt || new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": blog.author || "SmartHire Editorial Team",
      "url": siteUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": "SmartHire",
      "url": siteUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/favicon.svg`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl
    },
    "keywords": Array.isArray(blog.tags) ? blog.tags.join(', ') : '',
    "articleSection": blog.category,
    "inLanguage": "en-US"
  };

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${blog.metaTitle || blog.title} | SmartHire</title>
  <meta name="description" content="${blog.metaDescription || blog.excerpt}">
  <link rel="canonical" href="${postUrl}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${blog.metaTitle || blog.title}" />
  <meta property="og:description" content="${blog.metaDescription || blog.excerpt}" />
  <meta property="og:url" content="${postUrl}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:site_name" content="SmartHire Publication" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${blog.metaTitle || blog.title}" />
  <meta name="twitter:description" content="${blog.metaDescription || blog.excerpt}" />
  <meta name="twitter:image" content="${imageUrl}" />
  <script type="application/ld+json">
  ${JSON.stringify(ldJson)}
  </script>
  <link rel="stylesheet" href="/assets/index.css" />
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.7; color: #1e293b; background: #ffffff; margin: 0; padding: 0; }
    .blog-container { max-width: 820px; margin: 0 auto; padding: 32px 20px 80px; }
    .hero-img { width: 100%; max-height: 460px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px; }
    .badge { display: inline-block; background: #E6F4F1; color: #0D6B5F; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 4px; text-transform: uppercase; margin-bottom: 12px; }
    h1 { font-size: 32px; font-weight: 800; line-height: 1.3; color: #0f172a; margin-bottom: 16px; }
    .meta-bar { font-size: 14px; color: #64748b; margin-bottom: 28px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; }
    .article-body h2 { font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 36px; margin-bottom: 14px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
    .article-body h3 { font-size: 19px; font-weight: 700; color: #1e293b; margin-top: 24px; margin-bottom: 10px; }
    .article-body p { margin-bottom: 18px; font-size: 16px; color: #334155; }
    .article-body table { width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid #cbd5e1; font-size: 14px; }
    .article-body th { background: #f8fafc; font-weight: 700; text-align: left; padding: 10px 14px; border: 1px solid #cbd5e1; color: #334155; }
    .article-body td { padding: 9px 14px; border: 1px solid #cbd5e1; color: #475569; }
    .article-body ul { margin-bottom: 20px; padding-left: 24px; }
    .article-body li { margin-bottom: 8px; font-size: 15.5px; }
    .summary-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px 22px; margin-bottom: 28px; }
    .cta-box { background: #f8fafc; border: 1.5px solid #0D6B5F; border-radius: 8px; padding: 24px; margin-top: 40px; text-align: center; }
    .cta-btn { display: inline-block; background: #0D6B5F; color: #ffffff; padding: 10px 22px; border-radius: 6px; font-weight: 700; text-decoration: none; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="blog-container">
    <a href="/blog" style="color: #0D6B5F; text-decoration: none; font-size: 14px; font-weight: 600;">&larr; Back to Publication</a>
    <div style="margin-top: 20px;">
      <span class="badge">${blog.category}</span>
      <h1>${blog.title}</h1>
      <div class="meta-bar">By ${blog.author} · ${blog.date} · ${blog.readTime || '8 min read'}</div>
      <img src="${blog.image}" alt="${blog.title}" class="hero-img" />
      <div class="article-body">
        ${blog.contentHtml}
      </div>
      <div class="cta-box">
        <h3 style="margin-top: 0; color: #0f172a;">Looking for Verified Direct-Client Requisitions?</h3>
        <p style="color: #475569; margin-bottom: 14px;">Browse active C2C, W2, and 1099 contracts across Cloud, AI, and Software Engineering.</p>
        <a href="/jobs" class="cta-btn">Browse Open Jobs &rarr;</a>
      </div>
    </div>
  </div>
</body>
</html>`;

  const targetDirs = [
    path.resolve(__dirname, '../../public/blog'),
    path.resolve(__dirname, '../../dist/blog'),
    '/var/www/html/blog'
  ];

  for (const d of targetDirs) {
    try {
      if (fs.existsSync(d) || !d.startsWith('/var/www/html')) {
        if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
        fs.writeFileSync(path.join(d, `${blog.slug}.html`), htmlContent, 'utf-8');
      }
    } catch (_) {}
  }
}

/**
 * Orchestrator: Selects topic, writes article with AI, generates hero image, saves and publishes
 */
export async function generateDailyBlog(options = {}) {
  const { category, customTopic } = options;

  console.log(`\n[Blog Automation] Initiating article generation... (Custom topic: ${customTopic || 'None'})`);

  // 1. Gather existing slugs and titles to avoid any duplication
  const existingSlugs = new Set(blogsStore.map(b => (b.slug || '').toLowerCase()));
  const existingTitles = new Set(blogsStore.map(b => (b.title || '').toLowerCase()));

  // Add the 7 static built-in blog slugs to prevent collision
  const staticSlugs = [
    'data-center-staffing-boom',
    'highest-paying-it-certifications-2026',
    'ai-entry-level-it-jobs-2026',
    'india-vs-usa-it-jobs-2026',
    'us-it-recruitment-market-2026',
    'h1b-2026-update-it-work-visa-options',
    'c2c-vs-w2-vs-1099-it-contracts-guide'
  ];
  staticSlugs.forEach(s => existingSlugs.add(s));

  // 2. Select Topic
  let topicMeta;
  if (customTopic) {
    topicMeta = {
      title: customTopic,
      seedAngle: `Comprehensive 2026 US IT staffing, technical compensation, and industry intelligence on "${customTopic}".`,
      category: category || 'Market Trends',
      tags: ['US IT Staffing', 'Tech Careers 2026', 'IT Hiring', 'Direct Client IT'],
      suggestedSlug: customTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 75)
    };
  } else {
    topicMeta = selectNextTopic(existingSlugs, existingTitles);
  }

  console.log(`[Blog Automation] Topic selected: "${topicMeta.title}" (${topicMeta.category})`);

  // 3. Generate Deep Article with Groq 120B
  console.log(`[Blog Automation] Generating 1,500+ word SEO article with AI...`);
  const article = await generateArticleWithAI(topicMeta);

  // Double-check slug uniqueness
  let finalSlug = article.slug;
  if (existingSlugs.has(finalSlug)) {
    finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    article.slug = finalSlug;
  }

  // 4. Generate AI Hero Banner Image
  console.log(`[Blog Automation] Generating custom 1200x630 banner image...`);
  const heroImage = await generateHeroImage(article.slug, article.imagePrompt);
  article.image = heroImage;

  // 5. Construct Final Record
  const newBlogRecord = {
    id: `blog_${Date.now()}`,
    slug: article.slug,
    title: article.title,
    metaTitle: article.metaTitle || `${article.title} | SmartHire`,
    metaDescription: article.metaDescription || article.excerpt,
    excerpt: article.excerpt,
    category: article.category || topicMeta.category,
    readTime: article.readTime || '8 min read',
    tags: article.tags || ['IT Staffing', 'Tech Careers'],
    caption: article.caption || `SmartHire research intelligence: ${article.title}`,
    image: article.image,
    author: article.author || 'SmartHire Editorial Team',
    authorRole: article.authorRole || 'Technical Recruiting Research Group',
    authorBio: article.authorBio,
    date: article.date,
    publishedAt: article.publishedAt,
    contentHtml: article.contentHtml
  };

  // 6. Write Pre-rendered Static HTML file for instant Google search indexing
  try {
    writePreRenderedHtml(newBlogRecord);
  } catch (err) {
    console.warn('[Blog Automation] Failed to write pre-rendered static HTML:', err.message);
  }

  // 7. Persist to blogs.json
  blogsStore.unshift(newBlogRecord);
  saveBlogsToDisk();

  console.log(`[Blog Automation] Successfully published: https://smarthireus.com/blog/${newBlogRecord.slug}\n`);
  return newBlogRecord;
}

/**
 * Initializes daily background cron schedule
 * Checks every hour if a blog has been published within the last 24 hours; if not, triggers automation.
 */
export function initDailyBlogCron() {
  console.log('[Blog Automation] Initializing daily blog cron scheduler...');

  const checkAndRunDaily = async () => {
    try {
      const now = new Date();
      // Run once per day (checks if latest blog is older than 23 hours)
      const latest = blogsStore[0];
      const lastPubTime = latest?.publishedAt ? new Date(latest.publishedAt).getTime() : 0;
      const hoursSinceLast = (Date.now() - lastPubTime) / (1000 * 60 * 60);

      // Only trigger if at least 23 hours have elapsed since the last published post
      if (hoursSinceLast >= 23) {
        console.log(`[Daily Blog Cron] ${Math.round(hoursSinceLast)} hours since last post. Triggering automated daily blog...`);
        await generateDailyBlog();
      }
    } catch (err) {
      console.error('[Daily Blog Cron Error]:', err.message);
    }
  };

  // Check every 60 minutes
  setInterval(checkAndRunDaily, 60 * 60 * 1000);

  // Initial check 2 minutes after server boot
  setTimeout(checkAndRunDaily, 2 * 60 * 1000);
}
