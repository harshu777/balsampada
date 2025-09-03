#!/bin/bash

# ========================================
# AWS Deployment Script for Enhanced JWT
# Balsampada LMS Production Setup
# ========================================

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as sudo
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run this script with sudo"
    exit 1
fi

print_status "Starting Enhanced JWT Deployment on AWS..."

# ========================================
# 1. SYSTEM UPDATE & PREREQUISITES
# ========================================

print_status "Updating system packages..."
apt update && apt upgrade -y
apt install -y curl wget gnupg software-properties-common

# ========================================
# 2. INSTALL REDIS
# ========================================

print_status "Installing Redis..."

# Add Redis repository
curl -fsSL https://packages.redis.io/gpg | gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | tee /etc/redis/redis.list
apt update
apt install -y redis

# Generate secure Redis password
REDIS_PASSWORD=$(openssl rand -base64 32)

print_status "Configuring Redis security..."

# Backup original config
cp /etc/redis/redis.conf /etc/redis/redis.conf.backup

# Configure Redis
cat > /etc/redis/redis.conf << EOF
# Redis Configuration for JWT Enhanced Authentication
bind 127.0.0.1 ::1
protected-mode yes
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300

# Persistence
daemonize yes
supervised systemd
pidfile /var/run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log
databases 16

# Security
requirepass ${REDIS_PASSWORD}
maxclients 10000

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Snapshotting
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# Append only file
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
EOF

# Set proper permissions
chown redis:redis /etc/redis/redis.conf
chmod 640 /etc/redis/redis.conf

# Enable and start Redis
systemctl enable redis-server
systemctl restart redis-server

# Test Redis connection
if redis-cli -a "${REDIS_PASSWORD}" ping | grep -q PONG; then
    print_success "Redis installed and configured successfully"
else
    print_error "Redis installation failed"
    exit 1
fi

# ========================================
# 3. INSTALL NODE.JS & PM2
# ========================================

print_status "Installing Node.js 18.x..."

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2 globally
npm install -g pm2

# Setup PM2 startup script
pm2 startup systemd -u ubuntu --hp /home/ubuntu

print_success "Node.js and PM2 installed"

# ========================================
# 4. SETUP APPLICATION
# ========================================

print_status "Setting up application..."

# Navigate to app directory
APP_DIR="/var/www/balsampada"
cd ${APP_DIR}

# Pull latest code
print_status "Pulling latest code..."
git pull origin main

# Install backend dependencies
cd ${APP_DIR}/backend
npm install

# ========================================
# 5. CONFIGURE ENVIRONMENT VARIABLES
# ========================================

print_status "Configuring environment variables..."

# Check if .env exists
if [ ! -f .env ]; then
    print_error ".env file not found. Creating from template..."
    cp .env.example .env
fi

# Update Redis configuration in .env
sed -i "s|REDIS_URL=.*|REDIS_URL=redis://127.0.0.1:6379|g" .env
sed -i "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=${REDIS_PASSWORD}|g" .env

# Add Redis password if not exists
if ! grep -q "REDIS_PASSWORD" .env; then
    echo "REDIS_PASSWORD=${REDIS_PASSWORD}" >> .env
fi

# Generate secure JWT secrets if not already set
if ! grep -q "JWT_ACCESS_SECRET=" .env || grep -q "JWT_ACCESS_SECRET=$" .env; then
    JWT_ACCESS_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    sed -i "s|JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}|g" .env
fi

if ! grep -q "JWT_REFRESH_SECRET=" .env || grep -q "JWT_REFRESH_SECRET=$" .env; then
    JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}|g" .env
fi

# Set production environment
sed -i "s|NODE_ENV=.*|NODE_ENV=production|g" .env

print_success "Environment variables configured"

# ========================================
# 6. SETUP PM2 CONFIGURATION
# ========================================

print_status "Creating PM2 ecosystem configuration..."

cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'balsampada-backend',
    script: './src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    merge_logs: true,
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 5000,
    // Health monitoring
    min_uptime: '10s',
    max_restarts: 10,
    // Advanced features
    instance_var: 'INSTANCE_ID',
    post_update: ['npm install'],
  }]
};
EOF

# Create logs directory
mkdir -p logs
chown -R ubuntu:ubuntu logs

# ========================================
# 7. SETUP NGINX
# ========================================

print_status "Installing and configuring Nginx..."

apt install -y nginx

# Create Nginx configuration
cat > /etc/nginx/sites-available/balsampada << 'EOF'
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

# Upstream backend server
upstream balsampada_backend {
    least_conn;
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com;  # Replace with actual domain

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # API Routes
    location /api {
        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;
        
        # Special rate limiting for auth endpoints
        location ~ ^/api/auth/(login|register|refresh) {
            limit_req zone=auth_limit burst=5 nodelay;
            proxy_pass http://balsampada_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
        
        # Regular API proxy
        proxy_pass http://balsampada_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend routes (if serving from same server)
    location / {
        root /var/www/balsampada/frontend/.next;
        try_files $uri $uri/ /index.html;
    }

    # Logging
    access_log /var/log/nginx/balsampada_access.log;
    error_log /var/log/nginx/balsampada_error.log;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/balsampada /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t && systemctl reload nginx

print_success "Nginx configured"

# ========================================
# 8. SETUP FIREWALL
# ========================================

print_status "Configuring firewall..."

# Install UFW
apt install -y ufw

# Configure firewall rules
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

print_success "Firewall configured"

# ========================================
# 9. START APPLICATION
# ========================================

print_status "Starting application with PM2..."

cd ${APP_DIR}/backend

# Stop any existing PM2 processes
pm2 stop all || true
pm2 delete all || true

# Start application
pm2 start ecosystem.config.js
pm2 save

# Show status
pm2 status

print_success "Application started"

# ========================================
# 10. SETUP MONITORING & HEALTH CHECKS
# ========================================

print_status "Setting up monitoring..."

# Create health check script
cat > /home/ubuntu/health-check.sh << 'EOF'
#!/bin/bash

# Check Redis
if ! redis-cli -a "${REDIS_PASSWORD}" ping > /dev/null 2>&1; then
    echo "Redis is down!"
    systemctl restart redis-server
fi

# Check Node app
if ! curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "Backend is down!"
    cd /var/www/balsampada/backend
    pm2 restart all
fi

# Check Nginx
if ! systemctl is-active --quiet nginx; then
    echo "Nginx is down!"
    systemctl restart nginx
fi
EOF

chmod +x /home/ubuntu/health-check.sh
chown ubuntu:ubuntu /home/ubuntu/health-check.sh

# Add to crontab
(crontab -u ubuntu -l 2>/dev/null; echo "*/5 * * * * /home/ubuntu/health-check.sh") | crontab -u ubuntu -

print_success "Monitoring setup complete"

# ========================================
# 11. TEST ENHANCED JWT
# ========================================

print_status "Testing Enhanced JWT implementation..."

cd ${APP_DIR}/backend

# Wait for services to stabilize
sleep 5

# Run test
node test-jwt-enhanced.js

# ========================================
# 12. SECURITY HARDENING
# ========================================

print_status "Applying security hardening..."

# Disable root SSH login
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd

# Setup fail2ban
apt install -y fail2ban

cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
EOF

systemctl enable fail2ban
systemctl restart fail2ban

print_success "Security hardening complete"

# ========================================
# FINAL OUTPUT
# ========================================

echo ""
echo "========================================"
echo "   DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "========================================"
echo ""
echo "Important Information:"
echo "----------------------"
echo "Redis Password: ${REDIS_PASSWORD}"
echo ""
echo "Next Steps:"
echo "-----------"
echo "1. Update your domain in /etc/nginx/sites-available/balsampada"
echo "2. Install SSL certificate:"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d your-domain.com"
echo "3. Update frontend URL in .env file"
echo "4. Monitor logs:"
echo "   pm2 logs"
echo "   tail -f /var/log/nginx/balsampada_error.log"
echo "5. View application status:"
echo "   pm2 status"
echo ""
echo "Security Notes:"
echo "---------------"
echo "- Redis password has been set and saved to .env"
echo "- JWT secrets have been generated"
echo "- Firewall is active (ports 22, 80, 443 open)"
echo "- Rate limiting is configured"
echo "- Fail2ban is protecting SSH"
echo ""
echo "Save this output for reference!"