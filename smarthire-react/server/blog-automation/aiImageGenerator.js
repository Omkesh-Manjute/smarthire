// ─────────────────────────────────────────────────────────────────────────────
// AI IMAGE GENERATOR ENGINE (POLLINATIONS / DIRECT CLOUD BUFFER)
// ─────────────────────────────────────────────────────────────────────────────

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateHeroImage(slug, promptHint = '') {
  const cleanPrompt = (promptHint || 'modern enterprise tech office architectural server room high tech minimal photography')
    .replace(/[^\w\s,-]/g, '')
    .slice(0, 200) + ', ultra-realistic 8k editorial photography, corporate architectural aesthetic, clean lighting, no text, no logos';

  const encoded = encodeURIComponent(cleanPrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1200&height=630&nologo=true&seed=${Date.now() % 100000}`;

  const fileName = `${slug}-hero.jpg`;

  // Define target directories
  const targetDirs = [
    path.resolve(__dirname, '../../public/images/blog'),
    path.resolve(__dirname, '../../dist/images/blog'),
    '/var/www/html/images/blog'
  ];

  for (const d of targetDirs) {
    try {
      if (!fs.existsSync(d) && !d.startsWith('/var/www/html')) {
        fs.mkdirSync(d, { recursive: true });
      }
    } catch (_) {}
  }

  return new Promise((resolve) => {
    console.log(`[AI Image Generator] Generating 1200x630 hero banner for "${slug}"...`);

    const req = https.get(imageUrl, { timeout: 25000 }, (res) => {
      if (res.statusCode !== 200) {
        console.warn(`⚠️ [AI Image Generator] Image service returned HTTP ${res.statusCode}, using fallback.`);
        return resolve('/career-hero-slide2.jpg');
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        try {
          const buffer = Buffer.concat(chunks);
          if (buffer.length < 5000) {
            console.warn('⚠️ [AI Image Generator] Image buffer too small, using fallback.');
            return resolve('/career-hero-slide2.jpg');
          }

          let savedAtLeastOne = false;
          for (const d of targetDirs) {
            try {
              if (fs.existsSync(d)) {
                fs.writeFileSync(path.join(d, fileName), buffer);
                savedAtLeastOne = true;
              }
            } catch (_) {}
          }

          if (savedAtLeastOne) {
            console.log(`✅ [AI Image Generator] Successfully saved hero image: /images/blog/${fileName} (${Math.round(buffer.length / 1024)} KB)`);
            return resolve(`/images/blog/${fileName}`);
          } else {
            // Write to default public path
            const defaultPublic = path.resolve(__dirname, '../../public/images/blog');
            fs.mkdirSync(defaultPublic, { recursive: true });
            fs.writeFileSync(path.join(defaultPublic, fileName), buffer);
            return resolve(`/images/blog/${fileName}`);
          }
        } catch (e) {
          console.warn('⚠️ [AI Image Generator] Error saving image buffer:', e.message);
          return resolve('/career-hero-slide2.jpg');
        }
      });
    });

    req.on('error', (err) => {
      console.warn('⚠️ [AI Image Generator] Request failed:', err.message);
      resolve('/career-hero-slide2.jpg');
    });

    req.on('timeout', () => {
      req.destroy();
      console.warn('⚠️ [AI Image Generator] Timed out, using fallback banner.');
      resolve('/career-hero-slide2.jpg');
    });
  });
}
