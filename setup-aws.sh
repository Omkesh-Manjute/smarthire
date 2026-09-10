#!/usr/bin/env bash
# ==============================================================================
# SmartHire ATS + JobsInHand Bot + n8n + Email Gateway
# Automated AWS Lightsail / EC2 All-In-One Setup Script
# ==============================================================================
set -e

echo "=========================================================="
echo "🚀 Starting SmartHire ATS & n8n Production Setup on AWS..."
echo "=========================================================="

# 1. Update system packages
echo "📦 Updating OS packages..."
sudo apt-get update -y && sudo apt-get upgrade -y

# 2. Setup 4GB Swap Space (Crucial for $3.50 / $5 Instances)
echo "🧠 Configuring 4GB Virtual Swap Memory (prevents OOM)..."
if [ ! -f /swapfile ]; then
  sudo fallocate -l 4G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  sudo sysctl vm.swappiness=10
  echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
  echo "✅ 4GB Swap memory enabled!"
else
  echo "ℹ️ Swap file already exists."
fi

# 3. Install Node.js 20 LTS, Git, Docker, and Essentials
echo "⚙️ Installing Node.js 20 LTS, Git, Docker, and PM2..."
sudo apt-get install -y curl wget git unzip ca-certificates gnupg lsb-release

# NodeSource 20.x
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Docker & Docker Compose (for n8n)
if ! command -v docker &> /dev/null; then
  sudo apt-get install -y docker.io docker-compose
  sudo systemctl enable docker
  sudo systemctl start docker
  sudo usermod -aG docker $USER
fi

# PM2 Process Manager
sudo npm install -g pm2

# 4. Install Playwright Chromium & OS Dependencies
echo "🎭 Installing Playwright Chromium & Linux System Dependencies for JobsInHand Bot..."
sudo npx -y playwright install --with-deps chromium

# 5. Launch n8n Workflow Automation via Docker
echo "⚡ Setting up n8n Workflow Automation Studio..."
mkdir -p ~/n8n-docker
cat << 'EOF' > ~/n8n-docker/docker-compose.yml
version: '3.8'

services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    container_name: smarthire-n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=false
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - WEBHOOK_URL=http://localhost:5678/
      - GENERIC_TIMEZONE=Asia/Kolkata
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
EOF

cd ~/n8n-docker
sudo docker-compose down || true
sudo docker-compose up -d
echo "✅ n8n is running on port 5678!"

# 6. Summary & Next Steps
IP=$(curl -s http://checkip.amazonaws.com || echo "YOUR-SERVER-IP")
echo ""
echo "=========================================================="
echo "🎉 AWS ENVIRONMENT SETUP COMPLETED SUCCESSFULLY!"
echo "=========================================================="
echo "📍 Server Public IP: $IP"
echo "⚡ n8n Studio URL: http://$IP:5678"
echo "💼 SmartHire ATS will run on: http://$IP:8787"
echo ""
echo "Next step: Clone your Git repository and start SmartHire ATS via PM2:"
echo "  git clone https://github.com/Omkesh-Manjute/smarthire.git"
echo "  cd smarthire"
echo "  npm install"
echo "  node build.js"
echo "  pm2 start smarthire-react/server/index.js --name 'smarthire-ats'"
echo "  pm2 save && pm2 startup"
echo "=========================================================="
