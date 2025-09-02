#!/bin/bash

#########################################
# AWS EC2 Setup Script for Balsampada LMS
# Ubuntu 22.04 LTS - t2.micro
#########################################

set -e  # Exit on error

echo "======================================"
echo "🚀 Starting Balsampada LMS AWS Setup"
echo "======================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Update system
print_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_status "System updated"

# Install essential tools
print_info "Installing essential tools..."
sudo apt install -y curl wget git build-essential
print_status "Essential tools installed"

# Install Node.js 18 LTS
print_info "Installing Node.js 18 LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
print_status "Node.js $(node -v) installed"
print_status "npm $(npm -v) installed"

# Install MongoDB 6.0
print_info "Installing MongoDB 6.0..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
print_status "MongoDB installed"

# Start and enable MongoDB
print_info "Starting MongoDB service..."
sudo systemctl start mongod
sudo systemctl enable mongod
print_status "MongoDB service started and enabled"

# Create MongoDB database and user
print_info "Setting up MongoDB database..."
mongo <<EOF
use balsampada-lms
db.createUser({
  user: "lmsadmin",
  pwd: "ChangeMeSecurePassword123!",
  roles: [{ role: "readWrite", db: "balsampada-lms" }]
})
EOF
print_status "MongoDB database and user created"

# Install PM2 globally
print_info "Installing PM2 process manager..."
sudo npm install -g pm2
print_status "PM2 installed"

# Install Nginx
print_info "Installing Nginx..."
sudo apt install -y nginx
print_status "Nginx installed"

# Setup firewall
print_info "Configuring firewall..."
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 3000/tcp # Frontend Dev (temporary)
sudo ufw allow 5000/tcp # Backend API (temporary)
sudo ufw --force enable
print_status "Firewall configured"

# Create application directory
print_info "Creating application directory..."
sudo mkdir -p /var/www/balsampada-lms
sudo chown -R $USER:$USER /var/www/balsampada-lms
print_status "Application directory created"

# Clone repository (replace with your actual repo)
print_info "Enter your GitHub repository URL:"
read -p "Repository URL (or press Enter to skip): " REPO_URL

if [ ! -z "$REPO_URL" ]; then
    print_info "Cloning repository..."
    cd /var/www
    git clone $REPO_URL balsampada-lms
    cd balsampada-lms
    print_status "Repository cloned"
else
    print_info "Skipping repository clone. You'll need to upload files manually."
fi

# Create environment file templates
print_info "Creating environment templates..."

# Backend .env template
cat > /var/www/balsampada-lms/backend/.env.production <<'EOF'
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://lmsadmin:ChangeMeSecurePassword123!@localhost:27017/balsampada-lms?authSource=balsampada-lms

# JWT Secret (CHANGE THIS!)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_aws_deployment_2024
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Session Secret for OAuth (CHANGE THIS!)
SESSION_SECRET=your_super_secret_session_key_change_this_in_production_aws_2024

# Google OAuth Configuration (Add your credentials)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Frontend URL
FRONTEND_URL=http://your-domain.com
CLIENT_URL=http://your-domain.com

# Email Configuration (Optional - for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# AWS S3 Configuration (Optional - for file uploads)
USE_LOCAL_STORAGE=true
UPLOAD_PATH=./uploads
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=balsampada-lms-uploads
AWS_REGION=ap-south-1

# Payment Gateway (Optional)
STRIPE_SECRET_KEY=sk_live_your_stripe_key
RAZORPAY_KEY_ID=rzp_live_your_key
RAZORPAY_KEY_SECRET=your_secret

# Default Organization ID
DEFAULT_ORGANIZATION_ID=66b01f52175a5c5d6bde38a3
EOF

# Frontend .env.production template
cat > /var/www/balsampada-lms/frontend/.env.production <<'EOF'
# API Configuration
NEXT_PUBLIC_API_URL=http://your-domain.com/api

# Google Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Public Keys (if needed)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_your_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_key
EOF

print_status "Environment templates created"

# Create PM2 ecosystem file
print_info "Creating PM2 ecosystem configuration..."
cat > /var/www/balsampada-lms/ecosystem.config.js <<'EOF'
module.exports = {
  apps: [
    {
      name: 'lms-backend',
      script: './backend/src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/backend-err.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'lms-frontend',
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
      },
      error_file: './logs/frontend-err.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    }
  ]
};
EOF
print_status "PM2 ecosystem file created"

# Create logs directory
mkdir -p /var/www/balsampada-lms/logs
print_status "Logs directory created"

# Create Nginx configuration
print_info "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/balsampada-lms <<'EOF'
server {
    listen 80;
    server_name _;  # Replace with your domain

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support for Next.js HMR
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeout for long operations
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    # Static file uploads
    location /uploads {
        alias /var/www/balsampada-lms/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Next.js static files
    location /_next/static {
        alias /var/www/balsampada-lms/frontend/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Increase upload size limit
    client_max_body_size 100M;
}
EOF
print_status "Nginx configuration created"

# Enable Nginx site
print_info "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/balsampada-lms /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
print_status "Nginx configured and restarted"

# Create deployment script
print_info "Creating deployment script..."
cat > /var/www/balsampada-lms/deploy.sh <<'EOF'
#!/bin/bash

echo "🚀 Starting deployment..."

# Pull latest code
git pull origin main

# Backend deployment
echo "📦 Deploying backend..."
cd backend
npm ci --production
pm2 restart lms-backend

# Frontend deployment
echo "📦 Deploying frontend..."
cd ../frontend
npm ci
npm run build
pm2 restart lms-frontend

# Clear Nginx cache
sudo nginx -s reload

echo "✅ Deployment complete!"
EOF
chmod +x /var/www/balsampada-lms/deploy.sh
print_status "Deployment script created"

# Create backup script
print_info "Creating backup script..."
cat > /var/www/balsampada-lms/backup.sh <<'EOF'
#!/bin/bash

BACKUP_DIR="/home/ubuntu/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="balsampada-lms-backup-$TIMESTAMP"

mkdir -p $BACKUP_DIR

# Backup MongoDB
echo "Backing up MongoDB..."
mongodump --db balsampada-lms --out $BACKUP_DIR/$BACKUP_NAME/mongodb

# Backup uploads
echo "Backing up uploads..."
cp -r /var/www/balsampada-lms/backend/uploads $BACKUP_DIR/$BACKUP_NAME/

# Compress backup
echo "Compressing backup..."
tar -czf $BACKUP_DIR/$BACKUP_NAME.tar.gz -C $BACKUP_DIR $BACKUP_NAME
rm -rf $BACKUP_DIR/$BACKUP_NAME

echo "✅ Backup completed: $BACKUP_DIR/$BACKUP_NAME.tar.gz"

# Keep only last 7 backups
ls -t $BACKUP_DIR/*.tar.gz | tail -n +8 | xargs -r rm
EOF
chmod +x /var/www/balsampada-lms/backup.sh
print_status "Backup script created"

# Setup cron for backups
print_info "Setting up daily backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/balsampada-lms/backup.sh") | crontab -
print_status "Daily backup cron job created"

# Create monitoring script
cat > /var/www/balsampada-lms/monitor.sh <<'EOF'
#!/bin/bash

# Check if services are running
check_service() {
    if systemctl is-active --quiet $1; then
        echo "✅ $1 is running"
    else
        echo "❌ $1 is not running"
        sudo systemctl start $1
    fi
}

echo "=== System Status ==="
check_service nginx
check_service mongod

echo -e "\n=== PM2 Status ==="
pm2 status

echo -e "\n=== Disk Usage ==="
df -h | grep -E '^/dev/'

echo -e "\n=== Memory Usage ==="
free -h

echo -e "\n=== Recent Errors ==="
tail -n 5 /var/www/balsampada-lms/logs/backend-err.log 2>/dev/null || echo "No backend errors"
tail -n 5 /var/www/balsampada-lms/logs/frontend-err.log 2>/dev/null || echo "No frontend errors"
EOF
chmod +x /var/www/balsampada-lms/monitor.sh
print_status "Monitoring script created"

echo ""
echo "======================================"
echo "🎉 AWS EC2 Setup Complete!"
echo "======================================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Update environment files:"
echo "   - /var/www/balsampada-lms/backend/.env.production"
echo "   - /var/www/balsampada-lms/frontend/.env.production"
echo ""
echo "2. Install dependencies and build:"
echo "   cd /var/www/balsampada-lms/backend && npm install"
echo "   cd /var/www/balsampada-lms/frontend && npm install && npm run build"
echo ""
echo "3. Start applications with PM2:"
echo "   cd /var/www/balsampada-lms"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "4. Configure domain and SSL:"
echo "   sudo certbot --nginx -d your-domain.com"
echo ""
echo "5. Security reminders:"
echo "   - Change MongoDB password in .env.production"
echo "   - Update JWT_SECRET and SESSION_SECRET"
echo "   - Configure Google OAuth credentials"
echo "   - Set proper domain in Nginx config"
echo ""
echo "📊 Monitoring:"
echo "   Run: /var/www/balsampada-lms/monitor.sh"
echo ""
echo "🔄 Deployment:"
echo "   Run: /var/www/balsampada-lms/deploy.sh"
echo ""
echo "💾 Backup:"
echo "   Automatic daily at 2 AM or run: /var/www/balsampada-lms/backup.sh"
echo ""
echo "======================================"