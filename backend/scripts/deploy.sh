#!/bin/bash

# Balsampada LMS - Automated Deployment Script
# Run this on your AWS instance

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}     Balsampada LMS - Automated Deployment${NC}"
echo -e "${BLUE}==================================================${NC}\n"

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please don't run as root. Run as ubuntu user.${NC}"
   exit 1
fi

# Function to check command success
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 completed successfully${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Step 1: System Update
echo -e "\n${YELLOW}Step 1: Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y
check_status "System update"

# Step 2: Install Node.js
echo -e "\n${YELLOW}Step 2: Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    check_status "Node.js installation"
else
    echo -e "${GREEN}Node.js already installed: $(node -v)${NC}"
fi

# Step 3: Install MongoDB
echo -e "\n${YELLOW}Step 3: Installing MongoDB...${NC}"
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    sudo apt update
    sudo apt install -y mongodb-org
    sudo systemctl start mongod
    sudo systemctl enable mongod
    check_status "MongoDB installation"
else
    echo -e "${GREEN}MongoDB already installed${NC}"
fi

# Step 4: Install Nginx
echo -e "\n${YELLOW}Step 4: Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    check_status "Nginx installation"
else
    echo -e "${GREEN}Nginx already installed${NC}"
fi

# Step 5: Install PM2
echo -e "\n${YELLOW}Step 5: Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    check_status "PM2 installation"
else
    echo -e "${GREEN}PM2 already installed${NC}"
fi

# Step 6: Install Certbot
echo -e "\n${YELLOW}Step 6: Installing Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
    check_status "Certbot installation"
else
    echo -e "${GREEN}Certbot already installed${NC}"
fi

# Step 7: Create application directory
echo -e "\n${YELLOW}Step 7: Setting up application directory...${NC}"
sudo mkdir -p /var/www/balsampada
sudo chown -R $USER:$USER /var/www/balsampada
check_status "Directory setup"

# Step 8: Clone or update repository
echo -e "\n${YELLOW}Step 8: Getting latest code...${NC}"
cd /var/www/balsampada
if [ -d ".git" ]; then
    echo "Repository exists, pulling latest changes..."
    git pull origin main
else
    echo "Cloning repository..."
    git clone https://github.com/harshu777/balsampada.git .
fi
check_status "Code deployment"

# Step 9: Setup Backend
echo -e "\n${YELLOW}Step 9: Setting up backend...${NC}"
cd /var/www/balsampada/backend
npm install
check_status "Backend dependencies"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << EOF
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/balsampada-lms
JWT_SECRET=change_this_to_secure_random_string_$(openssl rand -hex 32)
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
EOF
    echo -e "${RED}⚠️  Please update .env file with your domain and secure values${NC}"
fi

# Step 10: Setup Frontend
echo -e "\n${YELLOW}Step 10: Setting up frontend...${NC}"
cd /var/www/balsampada/frontend
npm install
check_status "Frontend dependencies"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}Creating .env.local file...${NC}"
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Balsampada LMS
EOF
    echo -e "${RED}⚠️  Please update .env.local file with your domain${NC}"
fi

# Step 11: Build Frontend
echo -e "\n${YELLOW}Step 11: Building frontend...${NC}"
npm run build
check_status "Frontend build"

# Step 12: Create PM2 ecosystem file
echo -e "\n${YELLOW}Step 12: Configuring PM2...${NC}"
cd /var/www/balsampada
if [ ! -f "ecosystem.config.js" ]; then
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'balsampada-backend',
      script: './backend/src/server.js',
      cwd: './backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'balsampada-frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
}
EOF
fi

# Step 13: Start/Restart applications
echo -e "\n${YELLOW}Step 13: Starting applications with PM2...${NC}"
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
check_status "PM2 startup"

# Setup PM2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER 2>/dev/null || true

# Step 14: Create initial data
echo -e "\n${YELLOW}Step 14: Creating initial data...${NC}"
cd /var/www/balsampada/backend
node scripts/create-admin.js || true
node scripts/create-users.js || true

# Step 15: Setup Nginx
echo -e "\n${YELLOW}Step 15: Configuring Nginx...${NC}"
echo -e "${YELLOW}Please enter your domain name (e.g., example.com):${NC}"
read -p "Domain: " DOMAIN

if [ ! -z "$DOMAIN" ]; then
    sudo tee /etc/nginx/sites-available/balsampada > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    client_max_body_size 20M;
}
EOF
    
    sudo ln -sf /etc/nginx/sites-available/balsampada /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl reload nginx
    check_status "Nginx configuration"
    
    # Update environment files with domain
    sed -i "s|CLIENT_URL=.*|CLIENT_URL=https://$DOMAIN|g" /var/www/balsampada/backend/.env
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|g" /var/www/balsampada/backend/.env
    sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://$DOMAIN/api|g" /var/www/balsampada/frontend/.env.local
    
    # Rebuild and restart
    cd /var/www/balsampada/frontend
    npm run build
    pm2 restart all
else
    echo -e "${YELLOW}Skipping Nginx configuration. Configure manually later.${NC}"
fi

# Final status
echo -e "\n${GREEN}==================================================${NC}"
echo -e "${GREEN}     🎉 Deployment Complete!${NC}"
echo -e "${GREEN}==================================================${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo -e "1. Update DNS A records to point to this server's IP"
echo -e "2. Run: ${BLUE}sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN${NC}"
echo -e "3. Configure firewall: ${BLUE}sudo ufw allow 22,80,443/tcp && sudo ufw --force enable${NC}"
echo -e "\n${YELLOW}Useful Commands:${NC}"
echo -e "View logs: ${BLUE}pm2 logs${NC}"
echo -e "Monitor: ${BLUE}pm2 monit${NC}"
echo -e "Restart: ${BLUE}pm2 restart all${NC}"
echo -e "\n${GREEN}Application should be running at:${NC}"
echo -e "Frontend: ${BLUE}http://$DOMAIN${NC}"
echo -e "Backend: ${BLUE}http://$DOMAIN/api${NC}"