# AWS Deployment Manual Commands for Enhanced JWT System

## Prerequisites
- AWS EC2 Ubuntu instance (20.04 LTS or 22.04 LTS recommended)
- SSH access to your instance
- Domain name (optional but recommended)

## Step-by-Step Manual Deployment

### 1. Connect to AWS Instance
```bash
ssh -i your-key.pem ubuntu@your-aws-ip
```

### 2. Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget gnupg software-properties-common build-essential
```

### 3. Install and Configure Redis

#### Install Redis
```bash
# Add Redis repository
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/redis/redis.list
sudo apt update
sudo apt install -y redis
```

#### Configure Redis Security
```bash
# Generate a secure password
REDIS_PASSWORD=$(openssl rand -base64 32)
echo "Your Redis Password: $REDIS_PASSWORD"

# Edit Redis configuration
sudo nano /etc/redis/redis.conf
```

Add/modify these lines in redis.conf:
```conf
bind 127.0.0.1 ::1
requirepass YOUR_REDIS_PASSWORD_HERE
maxmemory 256mb
maxmemory-policy allkeys-lru
appendonly yes
```

```bash
# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Test Redis connection
redis-cli -a YOUR_REDIS_PASSWORD ping
# Should return: PONG
```

### 4. Install Node.js and PM2

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v
npm -v

# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 startup
pm2 startup systemd -u ubuntu --hp /home/ubuntu
# Copy and run the command it outputs
```

### 5. Clone/Update Application

```bash
# Create directory if not exists
sudo mkdir -p /var/www
cd /var/www

# Clone repository (if first time)
sudo git clone https://github.com/yourusername/balsampada-lms.git balsampada
# OR pull latest changes (if already exists)
cd balsampada
sudo git pull origin main

# Set proper permissions
sudo chown -R ubuntu:ubuntu /var/www/balsampada
```

### 6. Setup Backend

```bash
cd /var/www/balsampada/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
nano .env
```

Update .env with these values:
```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT Configuration
JWT_ACCESS_SECRET=$(openssl rand -base64 64 | tr -d '\n')
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Redis
REDIS_URL=redis://127.0.0.1:6379
REDIS_PASSWORD=your_redis_password_here

# Server
NODE_ENV=production
PORT=5000

# Frontend URL
CLIENT_URL=http://your-domain.com
```

### 7. Create PM2 Ecosystem File

```bash
cd /var/www/balsampada/backend
nano ecosystem.config.js
```

```javascript
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
    time: true
  }]
};
```

```bash
# Create logs directory
mkdir -p logs

# Start application
pm2 start ecosystem.config.js
pm2 save
```

### 8. Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create site configuration
sudo nano /etc/nginx/sites-available/balsampada
```

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

upstream balsampada_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location /api {
        limit_req zone=api_limit burst=20 nodelay;
        
        # Special rate limit for auth endpoints
        location ~ ^/api/auth/(login|register|refresh) {
            limit_req zone=auth_limit burst=5 nodelay;
            proxy_pass http://balsampada_backend;
        }
        
        proxy_pass http://balsampada_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        # Frontend configuration
        proxy_pass http://localhost:3000;  # If frontend runs on same server
    }
}
```

```bash
# Enable site
sudo ln -sf /etc/nginx/sites-available/balsampada /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
sudo systemctl enable nginx
```

### 9. Setup Firewall

```bash
# Install and configure UFW
sudo apt install -y ufw

# Configure firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

### 10. Install SSL Certificate (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

### 11. Test Enhanced JWT System

```bash
cd /var/www/balsampada/backend

# Run the test script
node test-jwt-enhanced.js
```

### 12. Setup Monitoring

```bash
# Create health check script
nano ~/health-check.sh
```

```bash
#!/bin/bash
# Check Redis
if ! redis-cli -a "YOUR_REDIS_PASSWORD" ping > /dev/null 2>&1; then
    echo "Redis is down! Restarting..."
    sudo systemctl restart redis-server
fi

# Check Backend
if ! curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "Backend is down! Restarting..."
    pm2 restart all
fi

# Check Nginx
if ! sudo systemctl is-active --quiet nginx; then
    echo "Nginx is down! Restarting..."
    sudo systemctl restart nginx
fi
```

```bash
# Make executable
chmod +x ~/health-check.sh

# Add to crontab (runs every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/ubuntu/health-check.sh") | crontab -
```

### 13. Additional Security Hardening

```bash
# Install fail2ban
sudo apt install -y fail2ban

# Configure fail2ban
sudo nano /etc/fail2ban/jail.local
```

```conf
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
```

```bash
# Restart fail2ban
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

## Useful Commands

### PM2 Management
```bash
pm2 status          # View application status
pm2 logs            # View logs
pm2 restart all     # Restart application
pm2 stop all        # Stop application
pm2 monit           # Real-time monitoring
```

### Redis Management
```bash
redis-cli -a YOUR_PASSWORD ping        # Test connection
redis-cli -a YOUR_PASSWORD info        # Redis information
redis-cli -a YOUR_PASSWORD monitor     # Monitor commands
redis-cli -a YOUR_PASSWORD flushdb     # Clear database (careful!)
```

### Nginx Management
```bash
sudo nginx -t                    # Test configuration
sudo systemctl restart nginx     # Restart Nginx
sudo systemctl status nginx      # Check status
tail -f /var/log/nginx/error.log # View error logs
```

### System Monitoring
```bash
htop                            # Process viewer
df -h                           # Disk usage
free -h                         # Memory usage
netstat -tlnp                   # Network connections
journalctl -xe                  # System logs
```

## Troubleshooting

### Redis Connection Issues
```bash
# Check if Redis is running
sudo systemctl status redis-server

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log

# Test authentication
redis-cli -a YOUR_PASSWORD ping
```

### Node Application Issues
```bash
# Check PM2 logs
pm2 logs --lines 100

# Check error logs
tail -f /var/www/balsampada/backend/logs/error.log

# Restart application
pm2 restart all
```

### Nginx Issues
```bash
# Check syntax
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Reload configuration
sudo systemctl reload nginx
```

## Important Notes

1. **Save all passwords securely** - Redis password, JWT secrets
2. **Backup .env file** - Contains all critical configuration
3. **Monitor disk space** - Redis and logs can consume space
4. **Regular updates** - Keep system and packages updated
5. **SSL Certificate** - Renews automatically every 90 days
6. **PM2 on reboot** - Configured to auto-start applications

## Quick Deployment Script

If you want to run all commands at once, use:
```bash
cd /var/www/balsampada/backend
chmod +x deploy-aws-enhanced-jwt.sh
sudo ./deploy-aws-enhanced-jwt.sh
```

This will automate the entire deployment process!