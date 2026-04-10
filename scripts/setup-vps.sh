#!/bin/bash
# ============================================================
# Dẹo Enterprise OS — VPS Initial Setup Script
# Run this ONCE on a fresh Ubuntu 22.04/24.04 VPS
# Usage: curl -sSL <raw_url> | bash
#   OR:  bash scripts/setup-vps.sh
# ============================================================
set -euo pipefail

echo "🖥️  Dẹo Enterprise OS — VPS Setup"
echo "================================================"

# 1. System update
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# 2. Install essentials
echo "🔧 Installing essentials..."
apt install -y \
    curl wget git htop unzip nano \
    ca-certificates gnupg lsb-release \
    ufw fail2ban

# 3. Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker $USER
    systemctl enable docker
    systemctl start docker
    echo "   Docker installed: $(docker --version)"
else
    echo "   Docker already installed: $(docker --version)"
fi

# 4. Install Docker Compose plugin
echo "🐳 Checking Docker Compose..."
if docker compose version &> /dev/null; then
    echo "   Docker Compose: $(docker compose version)"
else
    echo "   Installing Docker Compose plugin..."
    apt install -y docker-compose-plugin
fi

# 5. Firewall setup
echo "🔥 Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
echo "   UFW enabled: SSH, HTTP, HTTPS"

# 6. Fail2ban
echo "🛡️  Configuring fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# 7. Create app directory
echo "📁 Creating app directory..."
APP_DIR="/opt/deo-enterprise-os"
mkdir -p "$APP_DIR"
echo "   App directory: $APP_DIR"

# 8. Swap (for small VPS)
echo "💾 Setting up swap (2GB)..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "   Swap created: 2GB"
else
    echo "   Swap already exists"
fi

echo ""
echo "================================================"
echo "✅ VPS setup complete!"
echo ""
echo "NEXT STEPS:"
echo "  1. Clone your repo:"
echo "     cd /opt/deo-enterprise-os"
echo "     git clone https://github.com/YOUR_USER/deo-enterprise-os.git ."
echo ""
echo "  2. Create .env file:"
echo "     cp .env.example .env"
echo "     nano .env   # Fill in passwords and tokens"
echo ""
echo "  3. Deploy:"
echo "     bash scripts/deploy.sh"
echo ""
echo "  4. Setup 2nd Brain Hub (NEW in v1.2):"
echo "     bash scripts/setup-brain.sh"
echo ""
echo "  5. Setup Cloudflare Tunnel:"
echo "     - Go to Cloudflare Zero Trust Dashboard"
echo "     - Create a tunnel"
echo "     - Copy the tunnel token to .env TUNNEL_TOKEN"
echo "     - Add hostnames:"
echo "       dash.enterpriseos.bond → http://nginx:80"
echo "       api.enterpriseos.bond  → http://nginx:80"
echo "================================================"
