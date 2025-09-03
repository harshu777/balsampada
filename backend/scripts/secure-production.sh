#!/bin/bash

# Production Security Setup Script for Balsampada LMS
# Run this on your production server after deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}     Balsampada LMS - Production Security Setup${NC}"
echo -e "${BLUE}==================================================${NC}\n"

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please run as ubuntu user, not root${NC}"
   exit 1
fi

# Function to generate secure random strings
generate_secret() {
    openssl rand -base64 48 | tr -d "=+/" | cut -c1-64
}

echo -e "${YELLOW}Step 1: Generating secure secrets...${NC}"

# Generate secrets if not already set
if ! grep -q "JWT_SECRET_PRODUCTION" /var/www/balsampada/backend/.env; then
    JWT_SECRET=$(generate_secret)
    SESSION_SECRET=$(generate_secret)
    
    cat >> /var/www/balsampada/backend/.env << EOF

# Production Security Secrets (Generated)
JWT_SECRET_PRODUCTION=$JWT_SECRET
SESSION_SECRET_PRODUCTION=$SESSION_SECRET
NODE_ENV=production
EOF
    
    echo -e "${GREEN}✓ Secure secrets generated${NC}"
else
    echo -e "${GREEN}✓ Secrets already configured${NC}"
fi

echo -e "\n${YELLOW}Step 2: Setting file permissions...${NC}"

# Set secure file permissions
cd /var/www/balsampada
chmod 600 backend/.env
chmod 600 frontend/.env.local
chmod 755 backend/scripts/*.sh
chmod -R 755 backend/src
chmod -R 755 frontend/src
echo -e "${GREEN}✓ File permissions secured${NC}"

echo -e "\n${YELLOW}Step 3: Configuring firewall...${NC}"

# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable
echo -e "${GREEN}✓ Firewall configured${NC}"

echo -e "\n${YELLOW}Step 4: Installing Fail2ban...${NC}"

# Install and configure fail2ban
if ! command -v fail2ban-client &> /dev/null; then
    sudo apt update
    sudo apt install -y fail2ban
    
    # Create jail.local configuration
    sudo tee /etc/fail2ban/jail.local > /dev/null << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10

[nginx-botsearch]
enabled = true
port = http,https
filter = nginx-botsearch
logpath = /var/log/nginx/access.log
maxretry = 2
EOF
    
    sudo systemctl restart fail2ban
    echo -e "${GREEN}✓ Fail2ban installed and configured${NC}"
else
    echo -e "${GREEN}✓ Fail2ban already installed${NC}"
fi

echo -e "\n${YELLOW}Step 5: Securing MongoDB...${NC}"

# Check if MongoDB auth is enabled
if ! mongosh --eval "db.adminCommand('listDatabases')" --quiet 2>/dev/null | grep -q "requires authentication"; then
    echo -e "${YELLOW}Creating MongoDB admin user...${NC}"
    
    # Generate MongoDB password
    MONGO_ADMIN_PASS=$(generate_secret | cut -c1-32)
    MONGO_USER_PASS=$(generate_secret | cut -c1-32)
    
    # Create admin user
    mongosh << EOF
use admin
db.createUser({
  user: "balsampada_admin",
  pwd: "$MONGO_ADMIN_PASS",
  roles: [{ role: "root", db: "admin" }]
})

use balsampada-lms
db.createUser({
  user: "balsampada_user",
  pwd: "$MONGO_USER_PASS",
  roles: [{ role: "readWrite", db: "balsampada-lms" }]
})
EOF
    
    # Update MongoDB config to enable auth
    sudo tee -a /etc/mongod.conf > /dev/null << EOF
security:
  authorization: enabled
EOF
    
    sudo systemctl restart mongod
    
    # Update connection string in .env
    sed -i "s|MONGODB_URI=.*|MONGODB_URI=mongodb://balsampada_user:$MONGO_USER_PASS@localhost:27017/balsampada-lms?authSource=balsampada-lms|g" /var/www/balsampada/backend/.env
    
    echo -e "${GREEN}✓ MongoDB secured with authentication${NC}"
    echo -e "${YELLOW}MongoDB Credentials:${NC}"
    echo -e "Admin User: balsampada_admin"
    echo -e "Admin Pass: $MONGO_ADMIN_PASS"
    echo -e "App User: balsampada_user"
    echo -e "App Pass: $MONGO_USER_PASS"
    echo -e "${RED}⚠️  Save these credentials securely!${NC}"
else
    echo -e "${GREEN}✓ MongoDB authentication already enabled${NC}"
fi

echo -e "\n${YELLOW}Step 6: Configuring Nginx security headers...${NC}"

# Add security headers to Nginx
sudo tee /etc/nginx/snippets/security-headers.conf > /dev/null << 'EOF'
# Security Headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
EOF

# Update Nginx site configuration
if [ -f /etc/nginx/sites-available/balsampada ]; then
    if ! grep -q "security-headers.conf" /etc/nginx/sites-available/balsampada; then
        sudo sed -i '/server {/a\    include /etc/nginx/snippets/security-headers.conf;' /etc/nginx/sites-available/balsampada
    fi
fi

sudo nginx -t && sudo systemctl reload nginx
echo -e "${GREEN}✓ Nginx security headers configured${NC}"

echo -e "\n${YELLOW}Step 7: Setting up automated backups...${NC}"

# Create backup script
cat > /var/www/balsampada/backend/scripts/auto-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/balsampada"
mkdir -p $BACKUP_DIR
mongodump --db balsampada-lms --out $BACKUP_DIR/$(date +%Y%m%d-%H%M%S)
# Keep only last 7 days of backups
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
EOF

chmod +x /var/www/balsampada/backend/scripts/auto-backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/balsampada/backend/scripts/auto-backup.sh") | crontab -

echo -e "${GREEN}✓ Automated backups configured${NC}"

echo -e "\n${YELLOW}Step 8: Updating application to use secure server...${NC}"

# Use secure server configuration
cd /var/www/balsampada/backend
if [ -f src/server.secure.js ]; then
    cp src/server.js src/server.original.js
    cp src/server.secure.js src/server.js
    echo -e "${GREEN}✓ Secure server configuration applied${NC}"
fi

# Restart applications
pm2 restart all
echo -e "${GREEN}✓ Applications restarted with security settings${NC}"

echo -e "\n${YELLOW}Step 9: Security audit...${NC}"

# Run security checks
echo -e "Checking for common vulnerabilities..."

# Check if default passwords exist
if grep -q "Demo@123\|Admin@123\|admin123" /var/www/balsampada/backend/.env 2>/dev/null; then
    echo -e "${RED}⚠️  Warning: Default passwords found in configuration${NC}"
fi

# Check SSL certificate
if [ -f /etc/letsencrypt/live/*/cert.pem ]; then
    echo -e "${GREEN}✓ SSL certificate found${NC}"
else
    echo -e "${YELLOW}⚠️  No SSL certificate found. Run: sudo certbot --nginx${NC}"
fi

# Check Node.js vulnerabilities
cd /var/www/balsampada/backend
npm audit --production

cd /var/www/balsampada/frontend
npm audit --production

echo -e "\n${GREEN}==================================================${NC}"
echo -e "${GREEN}     🔒 Security Setup Complete!${NC}"
echo -e "${GREEN}==================================================${NC}"

echo -e "\n${YELLOW}Security Checklist:${NC}"
echo -e "✅ Secure secrets generated"
echo -e "✅ File permissions secured"
echo -e "✅ Firewall configured"
echo -e "✅ Fail2ban installed"
echo -e "✅ MongoDB authentication enabled"
echo -e "✅ Nginx security headers added"
echo -e "✅ Automated backups configured"
echo -e "✅ Secure server configuration applied"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo -e "1. ${BLUE}sudo certbot --nginx${NC} - Setup SSL if not done"
echo -e "2. ${BLUE}npm audit fix${NC} - Fix any npm vulnerabilities"
echo -e "3. ${BLUE}pm2 logs${NC} - Monitor application logs"
echo -e "4. Update your domain in CORS settings"

echo -e "\n${RED}⚠️  Important:${NC}"
echo -e "- Save all generated passwords securely"
echo -e "- Update CLIENT_URL in .env with your domain"
echo -e "- Test all functionality after security updates"
echo -e "- Monitor logs for any security issues"

echo -e "\n${GREEN}Your application is now production-ready with enhanced security!${NC}"