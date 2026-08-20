import fs from 'fs';
import { execSync } from 'child_process';

console.log('🚀 Starting project build for Vercel / Render deployment...');

try {
  // 1. Build the react frontend
  console.log('📦 Building smarthire-react frontend...');
  execSync('npm run build --prefix smarthire-react', { stdio: 'inherit' });

  // 2. Sync build output to root /dist folder (while keeping smarthire-react/dist intact)
  console.log('🚚 Routing static files to root "/dist"...');
  fs.rmSync('dist', { recursive: true, force: true });
  fs.cpSync('smarthire-react/dist', 'dist', { recursive: true });

  // 3. Copy api folder to root for serverless function detection (if exists)
  console.log('🚚 Routing api files to root "/api"...');
  fs.rmSync('api', { recursive: true, force: true });
  if (fs.existsSync('smarthire-react/api')) {
    fs.cpSync('smarthire-react/api', 'api', { recursive: true });
  }

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
