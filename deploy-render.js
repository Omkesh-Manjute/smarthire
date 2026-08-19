import fs from 'fs';
import path from 'path';

// Read backend .env file to get RENDER_API_KEY
const envPath = path.resolve('smarthire-backend/.env');
let apiKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/RENDER_API_KEY=(.*)/);
  if (match) {
    apiKey = match[1].trim();
  }
}

if (!apiKey) {
  console.error('❌ RENDER_API_KEY not found in backend .env file');
  process.exit(1);
}

const RENDER_API_URL = 'https://api.render.com/v1';

async function fetchServices() {
  console.log('🔄 Fetching your Render services...');
  try {
    const res = await fetch(`${RENDER_API_URL}/services?limit=20`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    
    // Check if it's an array directly or inside a result wrapper
    const rawServices = Array.isArray(data) ? data : data.services || [];
    const services = rawServices.map(item => item.service || item);

    if (services.length === 0) {
      console.log('⚠️ No services found in your Render account.');
      return;
    }

    console.log('\n📦 Active Render Services found:');
    console.log('====================================');
    services.forEach((s, idx) => {
      console.log(`${idx + 1}. 📛 Name: ${s.name}`);
      console.log(`   🆔 Service ID: ${s.id}`);
      console.log(`   🛠️ Type: ${s.type}`);
      console.log(`   🟢 Status: ${s.status}`);
      console.log(`   🔗 URL: ${s.url || 'N/A'}`);
      console.log(`   🌱 Repo: ${s.repo || 'N/A'}`);
      console.log('------------------------------------');
    });

    // If there is a service, offer how to deploy
    console.log('\n💡 Tip: To trigger deployment, run:');
    console.log(`   node deploy-render.js --deploy <service-id>`);
  } catch (error) {
    console.error('❌ Failed to fetch Render services:', error.message);
  }
}

async function triggerDeploy(serviceId) {
  console.log(`🚀 Triggering deployment for Service ID: ${serviceId}...`);
  try {
    const res = await fetch(`${RENDER_API_URL}/services/${serviceId}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    console.log('✅ Deployment successfully triggered!');
    console.log(`   Deploy ID: ${data.id}`);
    console.log(`   Status: ${data.status}`);
  } catch (error) {
    console.error('❌ Failed to trigger deployment:', error.message);
  }
}

// CLI args parsing
const args = process.argv.slice(2);
if (args[0] === '--deploy' && args[1]) {
  triggerDeploy(args[1]);
} else {
  fetchServices();
}
