import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = __dirname;

console.log('🔄 Starting project renaming script...');

try {
  // 1. Rename verifyhire-react to smarthire-react
  const oldReactPath = path.join(rootDir, 'verifyhire-react');
  const newReactPath = path.join(rootDir, 'smarthire-react');
  if (fs.existsSync(oldReactPath)) {
    console.log(`Moving ${oldReactPath} -> ${newReactPath}`);
    fs.renameSync(oldReactPath, newReactPath);
  } else {
    console.log('smarthire-react already renamed or verifyhire-react not found.');
  }

  // 2. Rename verifyhire-backend to smarthire-backend
  const oldBackendPath = path.join(rootDir, 'verifyhire-backend');
  const newBackendPath = path.join(rootDir, 'smarthire-backend');
  if (fs.existsSync(oldBackendPath)) {
    console.log(`Moving ${oldBackendPath} -> ${newBackendPath}`);
    fs.renameSync(oldBackendPath, newBackendPath);
  } else {
    console.log('smarthire-backend already renamed or verifyhire-backend not found.');
  }

  // 3. Delete unused Smart Hire AI folder
  const unusedAiPath = path.join(rootDir, 'Smart Hire AI');
  if (fs.existsSync(unusedAiPath)) {
    console.log(`Deleting unused folder: ${unusedAiPath}`);
    fs.rmSync(unusedAiPath, { recursive: true, force: true });
  }

  // 4. Delete accidental nul file
  const nulPath = path.join(rootDir, 'nul');
  if (fs.existsSync(nulPath)) {
    console.log('Attempting to delete nul file...');
    try {
      fs.unlinkSync(nulPath);
    } catch (e) {
      console.log('Note: direct nul delete skipped, will delete via cmd prompt');
    }
  }

  console.log('✅ Directories renamed and cleaned up successfully!');
} catch (err) {
  console.error('❌ Rename Error:', err.message);
}
