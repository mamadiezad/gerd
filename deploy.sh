#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🌐 Gerd — One-Click Deployment Script
# ═══════════════════════════════════════════════════════════════
# This script will:
#   1. Install Docker & Docker Compose (if not present)
#   2. Clone/Update Gerd
#   3. Configure Nginx + SSL with Let's Encrypt
#   4. Start the application
#   5. Set up automatic renewal
#
# Usage: bash deploy.sh
# ═══════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🌐 Gerd — One-Click Deploy         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# ─── 1. LOAD CONFIG ───
CONFIG_FILE="gerd.conf"
if [ ! -f "$CONFIG_FILE" ]; then
  echo -e "${YELLOW}📝 Creating config file: $CONFIG_FILE${NC}"
  echo ""
  echo "لطفاً اطلاعات زیر را وارد کنید:"
  echo ""
  
  read -p "🌐 Domain (e.g. gerd.example.com): " DOMAIN
  read -p "📧 Email (for SSL): " EMAIL
  read -p "🔑 JWT Secret (random string, press Enter for auto): " JWT_SECRET
  JWT_SECRET=${JWT_SECRET:-$(openssl rand -hex 32)}
  read -p "💾 MongoDB volume path (default: ./data/mongo): " MONGO_PATH
  MONGO_PATH=${MONGO_PATH:-"./data/mongo"}
  read -p "🎨 Install with Docker? (yes/no, default: yes): " USE_DOCKER
  USE_DOCKER=${USE_DOCKER:-"yes"}
  
  cat > "$CONFIG_FILE" << EOF
# 🌐 Gerd Configuration
# Created: $(date)

# Domain
DOMAIN=$DOMAIN
EMAIL=$EMAIL

# Security
JWT_SECRET=$JWT_SECRET

# Database
MONGO_PATH=$MONGO_PATH

# Setup
USE_DOCKER=$USE_DOCKER

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=$(openssl rand -hex 8)
INVITE_CODES=GERD2024
EOF

  echo -e "${GREEN}✅ Config saved to $CONFIG_FILE${NC}"
  echo -e "${YELLOW}⚠️  Admin password saved in config file. Keep it safe!${NC}"
  echo ""
else
  echo -e "${GREEN}✅ Loading config from $CONFIG_FILE${NC}"
  source "$CONFIG_FILE"
fi

source "$CONFIG_FILE"

# ─── 2. CHECK SYSTEM ───
echo -e "${BLUE}📋 Checking system requirements...${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${YELLOW}⚠️  Not running as root. Some features may need sudo.${NC}"
  SUDO="sudo"
else
  SUDO=""
fi

# Check Docker
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}🔧 Installing Docker...${NC}"
  curl -fsSL https://get.docker.com | $SUDO sh
  $SUDO usermod -aG docker $USER
  echo -e "${GREEN}✅ Docker installed${NC}"
else
  echo -e "${GREEN}✅ Docker: $(docker --version)${NC}"
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
  echo -e "${YELLOW}🔧 Installing Docker Compose...${NC}"
  $SUDO curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  $SUDO chmod +x /usr/local/bin/docker-compose
  echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
  echo -e "${GREEN}✅ Docker Compose: $(docker-compose --version)${NC}"
fi

# ─── 3. CLONE/UPDATE PROJECT ───
echo -e "${BLUE}📦 Setting up Gerd...${NC}"

PROJECT_DIR="/opt/gerd"
if [ ! -d "$PROJECT_DIR" ]; then
  echo -e "${YELLOW}📥 Cloning Gerd...${NC}"
  $SUDO git clone https://github.com/mamadiezad/gerd.git "$PROJECT_DIR"
  cd "$PROJECT_DIR"
else
  cd "$PROJECT_DIR"
  echo -e "${YELLOW}🔄 Updating Gerd...${NC}"
  $SUDO git pull
fi

# Create env file
$SUDO cat > "$PROJECT_DIR/.env" << EOF
MONGODB_URI=mongodb://mongo:27017/gerd
JWT_SECRET=$JWT_SECRET
SITE_URL=https://$DOMAIN
INVITE_CODES=$INVITE_CODES
ADMIN_USERNAME=$ADMIN_USERNAME
ADMIN_PASSWORD=$ADMIN_PASSWORD
EOF

# Create docker-compose.override.yml with env
$SUDO cat > "$PROJECT_DIR/docker-compose.override.yml" << EOF
version: "3.9"
services:
  app:
    environment:
      - MONGODB_URI=mongodb://mongo:27017/gerd
      - JWT_SECRET=$JWT_SECRET
      - SITE_URL=https://$DOMAIN
      - INVITE_CODES=$INVITE_CODES
EOF

echo -e "${GREEN}✅ Project ready at $PROJECT_DIR${NC}"

# ─── 4. SETUP NGINX + SSL ───
echo -e "${BLUE}🔒 Setting up Nginx + SSL...${NC}"

# Create nginx config
$SUDO tee /etc/nginx/sites-available/gerd << EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Upload limit
    client_max_body_size 50M;
}
EOF

# Enable site
$SUDO ln -sf /etc/nginx/sites-available/gerd /etc/nginx/sites-enabled/
$SUDO rm -f /etc/nginx/sites-enabled/default

# Check if certbot exists, install if not
if ! command -v certbot &> /dev/null; then
  echo -e "${YELLOW}🔧 Installing Certbot...${NC}"
  $SUDO apt-get update -qq
  $SUDO apt-get install -y -qq certbot python3-certbot-nginx
fi

# Get SSL certificate
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo -e "${YELLOW}📜 Getting SSL certificate for $DOMAIN...${NC}"
  $SUDO certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" || {
    echo -e "${RED}❌ SSL certificate failed. Check domain DNS.${NC}"
    echo -e "${YELLOW}   Using self-signed for now...${NC}"
    $SUDO openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
      -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
      -subj "/CN=$DOMAIN"
  }
else
  echo -e "${GREEN}✅ SSL certificate exists${NC}"
fi

# Test nginx
$SUDO nginx -t && $SUDO systemctl restart nginx || echo -e "${RED}❌ Nginx config error${NC}"

# Set up auto-renewal
$SUDO crontab -l 2>/dev/null | grep -q certbot || {
  ($SUDO crontab -l 2>/dev/null; echo "0 3 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | $SUDO crontab -
  echo -e "${GREEN}✅ SSL auto-renewal set up${NC}"
}

echo -e "${GREEN}✅ Nginx + SSL configured for $DOMAIN${NC}"

# ─── 5. START APPLICATION ───
echo -e "${BLUE}🚀 Starting Gerd...${NC}"
cd "$PROJECT_DIR"

# Create MongoDB data directory
$SUDO mkdir -p "$MONGO_PATH"
$SUDO chown -R 1000:1000 "$MONGO_PATH" 2>/dev/null || true

# Start services
$SUDO docker-compose up -d --build

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ Gerd is LIVE!                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  🌐 ${BLUE}https://$DOMAIN${NC}"
echo ""
echo -e "  📧 Admin login: ${YELLOW}$ADMIN_USERNAME${NC}"
echo -e "  🔑 Admin pass:  ${YELLOW}$ADMIN_PASSWORD${NC}"
echo -e "  🎫 Invite code: ${YELLOW}$INVITE_CODES${NC}"
echo ""
echo -e "  📁 Project:     $PROJECT_DIR"
echo -e "  📝 Config:      $PROJECT_DIR/$CONFIG_FILE"
echo -e "  💾 Database:    $MONGO_PATH"
echo ""
echo -e "  ${YELLOW}⚠️  برای تغییرات بعدی، فقط کافیه run کنی:${NC}"
echo -e "  ${GREEN}bash deploy.sh${NC}"
echo ""
