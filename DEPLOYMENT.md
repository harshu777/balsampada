# Production Deployment Guide

## Prerequisites for Production

### 1. **Domain & SSL**
- Purchase a domain name
- Set up SSL certificates (Let's Encrypt recommended)
- Configure DNS to point to your server

### 2. **Server Requirements**
- **Minimum**: 2GB RAM, 2 CPU cores, 20GB storage
- **Recommended**: 4GB RAM, 4 CPU cores, 50GB storage
- Ubuntu 20.04+ or similar Linux distribution

### 3. **Required Services**
- Node.js 18+
- MongoDB (Atlas recommended for production)
- Nginx (reverse proxy)
- PM2 (process manager)

## Option 1: Docker Deployment (Recommended)

### 1. Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. Clone and Deploy
```bash
git clone <your-repo>
cd balsampada-lms
docker-compose up -d
```

### 3. Create Admin User
```bash
docker exec balsampada-backend node setup.js
```

## Option 2: Manual Deployment

### 1. Server Setup
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt update
sudo apt install nginx
```

### 2. Database Setup
**Option A: MongoDB Atlas (Recommended)**
- Create account at mongodb.com/cloud/atlas
- Create cluster and get connection string
- Update .env with Atlas connection string

**Option B: Self-hosted MongoDB**
```bash
sudo apt install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### 3. Application Deployment
```bash
# Clone repository
git clone <your-repo>
cd balsampada-lms

# Backend setup
cd backend
npm install --production
cp .env.example .env
# Edit .env with production settings
node setup.js
pm2 start src/server.js --name "balsampada-backend"

# Frontend setup
cd ../frontend
npm install
npm run build
pm2 start npm --name "balsampada-frontend" -- start
```

### 4. Nginx Configuration
```nginx
# /etc/nginx/sites-available/balsampada
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. Enable and Start Services
```bash
sudo ln -s /etc/nginx/sites-available/balsampada /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
pm2 startup
pm2 save
```

## Environment Variables for Production

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/balsampada-lms
JWT_SECRET=your-super-secure-jwt-secret-256-bits-long
JWT_EXPIRE=7d
CLIENT_URL=https://your-domain.com

# Email (Required for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Storage (Choose one)
# AWS S3
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_BUCKET_NAME=balsampada-uploads
AWS_REGION=us-east-1

# Cloudinary (Alternative)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Payments
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_APP_NAME=Balsampada LMS
NEXT_PUBLIC_RAZORPAY_KEY_ID=your-razorpay-public-key
```

## Security Checklist

- [ ] Use HTTPS with valid SSL certificates
- [ ] Update all default passwords
- [ ] Set up firewall (allow only 22, 80, 443)
- [ ] Regular security updates
- [ ] MongoDB authentication enabled
- [ ] Rate limiting configured
- [ ] Backup strategy implemented
- [ ] Environment variables secured
- [ ] Log monitoring setup

## Monitoring & Maintenance

### 1. **Log Monitoring**
```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. **Database Backups**
```bash
# MongoDB backup (if self-hosted)
mongodump --out /backup/$(date +%Y%m%d)

# Atlas backups are automatic
```

### 3. **Updates**
```bash
# Application updates
git pull
cd backend && npm install --production
cd ../frontend && npm install && npm run build
pm2 restart all
```

## Scaling Considerations

### Load Balancing
- Use multiple server instances
- Configure Nginx load balancing
- Database read replicas

### CDN Integration
- CloudFlare for static assets
- AWS CloudFront
- Image optimization

### Database Optimization
- MongoDB indexing
- Connection pooling
- Sharding for large datasets