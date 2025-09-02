#!/bin/bash

#########################################
# Pre-deployment Preparation Script
# Run this BEFORE uploading to AWS
#########################################

echo "======================================"
echo "📦 Preparing Balsampada LMS for AWS Deployment"
echo "======================================"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running from project root
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Cleaning up development files...${NC}"
# Remove development files
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
find . -name ".next" -type d -prune -exec rm -rf '{}' +
find . -name "dist" -type d -prune -exec rm -rf '{}' +
find . -name "*.log" -type f -delete
find . -name ".DS_Store" -type f -delete

echo -e "${GREEN}✓ Cleanup complete${NC}"

echo -e "${YELLOW}Step 2: Creating production environment templates...${NC}"

# Backend production env
cat > backend/.env.production.template <<'EOF'
# IMPORTANT: Copy this to .env.production and update all values

# Server Configuration
PORT=5000
NODE_ENV=production

# Database (Update password!)
MONGODB_URI=mongodb://lmsadmin:CHANGE_THIS_PASSWORD@localhost:27017/balsampada-lms?authSource=balsampada-lms

# Security (Generate new secrets!)
# Generate with: openssl rand -base64 32
JWT_SECRET=GENERATE_NEW_SECRET_HERE
SESSION_SECRET=GENERATE_NEW_SECRET_HERE
JWT_EXPIRE=7d

# URLs (Update with your domain/IP)
FRONTEND_URL=http://YOUR_EC2_IP_OR_DOMAIN
CLIENT_URL=http://YOUR_EC2_IP_OR_DOMAIN

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Storage
USE_LOCAL_STORAGE=true
UPLOAD_PATH=./uploads
EOF

# Frontend production env
cat > frontend/.env.production.template <<'EOF'
# IMPORTANT: Copy this to .env.production and update

# API URL (Update with your domain/IP)
NEXT_PUBLIC_API_URL=http://YOUR_EC2_IP_OR_DOMAIN/api

# Optional
NEXT_PUBLIC_GA_ID=
EOF

echo -e "${GREEN}✓ Environment templates created${NC}"

echo -e "${YELLOW}Step 3: Creating deployment package...${NC}"

# Create deployment directory
mkdir -p aws-deployment

# Copy necessary files
cp -r backend aws-deployment/
cp -r frontend aws-deployment/
cp ecosystem.config.js aws-deployment/ 2>/dev/null || true
cp aws-setup.sh aws-deployment/
cp AWS_DEPLOYMENT_GUIDE.md aws-deployment/

# Create package.json for root
cat > aws-deployment/package.json <<'EOF'
{
  "name": "balsampada-lms",
  "version": "1.0.0",
  "description": "Balsampada LMS - Full Stack Application",
  "scripts": {
    "install:all": "cd backend && npm install && cd ../frontend && npm install",
    "build:frontend": "cd frontend && npm run build",
    "start:backend": "cd backend && npm start",
    "start:frontend": "cd frontend && npm start",
    "start:all": "pm2 start ecosystem.config.js",
    "stop:all": "pm2 stop all",
    "restart:all": "pm2 restart all",
    "logs": "pm2 logs"
  }
}
EOF

# Create README for deployment
cat > aws-deployment/README_DEPLOYMENT.md <<'EOF'
# Deployment Instructions

## Quick Start on EC2

1. **Run the setup script:**
   ```bash
   chmod +x aws-setup.sh
   sudo ./aws-setup.sh
   ```

2. **Configure environment:**
   ```bash
   cp backend/.env.production.template backend/.env.production
   cp frontend/.env.production.template frontend/.env.production
   # Edit both files with your values
   ```

3. **Install dependencies:**
   ```bash
   cd backend && npm install --production
   cd ../frontend && npm install && npm run build
   ```

4. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

5. **Verify:**
   - Frontend: http://your-ip:3000
   - Backend: http://your-ip:5000/api/health
   - Via Nginx: http://your-ip

## Important Security Steps

1. Change MongoDB password
2. Generate new JWT_SECRET
3. Generate new SESSION_SECRET
4. Update CORS origins
5. Configure firewall rules

## Support

Refer to AWS_DEPLOYMENT_GUIDE.md for detailed instructions.
EOF

echo -e "${GREEN}✓ Deployment package created${NC}"

echo -e "${YELLOW}Step 4: Creating archive for upload...${NC}"

# Create tar archive
tar -czf balsampada-lms-aws-deploy.tar.gz -C aws-deployment .

echo -e "${GREEN}✓ Archive created: balsampada-lms-aws-deploy.tar.gz${NC}"

# File size
SIZE=$(du -h balsampada-lms-aws-deploy.tar.gz | cut -f1)
echo -e "${GREEN}Archive size: $SIZE${NC}"

echo ""
echo "======================================"
echo -e "${GREEN}✅ Preparation Complete!${NC}"
echo "======================================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Upload to EC2:"
echo "   scp -i your-key.pem balsampada-lms-aws-deploy.tar.gz ubuntu@your-ec2-ip:~/"
echo ""
echo "2. On EC2, extract:"
echo "   tar -xzf balsampada-lms-aws-deploy.tar.gz"
echo ""
echo "3. Run setup:"
echo "   chmod +x aws-setup.sh"
echo "   ./aws-setup.sh"
echo ""
echo "4. Configure environments and deploy!"
echo ""
echo "======================================"