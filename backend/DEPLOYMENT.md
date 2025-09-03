# Balsampada LMS - AWS Deployment Guide

## Prerequisites

Your AWS instance should have:
- Ubuntu 20.04 or 22.04 LTS
- At least 2GB RAM (4GB recommended)
- 20GB storage minimum
- Security groups configured for ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000, 5000

## Step 1: Connect to Your AWS Instance

```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

## Step 2: Initial Server Setup

Run these commands on your AWS instance:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl git nginx certbot python3-certbot-nginx

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2
sudo npm install -g pm2

# Create app directory
sudo mkdir -p /var/www/balsampada
sudo chown -R $USER:$USER /var/www/balsampada
```

## Step 3: Clone and Setup Application

```bash
cd /var/www/balsampada
git clone https://github.com/harshu777/balsampada.git .

# Setup Backend
cd backend
npm install
cp .env.example .env  # Create this if not exists

# Edit .env file
nano .env
```

Update these values in backend .env:
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/balsampada-lms
JWT_SECRET=your-secure-jwt-secret-change-this
CLIENT_URL=https://yourdomain.com
```

```bash
# Setup Frontend
cd ../frontend
npm install
cp .env.local.example .env.local  # Create this if not exists

# Edit .env.local file
nano .env.local
```

Update these values in frontend .env.local:
```
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_APP_NAME=Balsampada LMS
```

## Step 4: Build Applications

```bash
# Build Frontend
cd /var/www/balsampada/frontend
npm run build

# Test Backend
cd /var/www/balsampada/backend
node src/server.js  # Test if it starts, then Ctrl+C
```

## Step 5: Setup PM2

Create PM2 ecosystem file:

```bash
cd /var/www/balsampada
nano ecosystem.config.js
```

Add this content:
```javascript
module.exports = {
  apps: [
    {
      name: 'balsampada-backend',
      script: './backend/src/server.js',
      cwd: './backend',
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
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
}
```

Start applications:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow the instructions it provides
```

## Step 6: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/balsampada
```

Add this configuration (replace yourdomain.com):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
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
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 20M;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/balsampada /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 7: Setup SSL with Let's Encrypt

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Step 8: Configure Domain DNS

In your domain provider's DNS settings, add:
- A record: @ → Your AWS Instance IP
- A record: www → Your AWS Instance IP

## Step 9: Security Setup

```bash
# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Secure MongoDB
mongosh
use admin
db.createUser({
  user: "adminUser",
  pwd: "strongPassword",
  roles: ["root"]
})
exit

# Update MongoDB connection string in backend .env
# MONGODB_URI=mongodb://adminUser:strongPassword@localhost:27017/balsampada-lms?authSource=admin
```

## Step 10: Create Initial Data

```bash
cd /var/www/balsampada/backend
node scripts/create-admin.js
node scripts/create-users.js
```

## Maintenance Commands

```bash
# View logs
pm2 logs

# Restart applications
pm2 restart all

# Monitor applications
pm2 monit

# Update application
cd /var/www/balsampada
git pull
cd backend && npm install
cd ../frontend && npm install && npm run build
pm2 restart all

# Backup database
cd /var/www/balsampada/backend
./scripts/backup-database.sh
```

## Troubleshooting

1. **Port already in use**: Kill the process using the port
   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **MongoDB not starting**: Check logs
   ```bash
   sudo systemctl status mongod
   sudo journalctl -u mongod
   ```

3. **PM2 apps not starting**: Check logs
   ```bash
   pm2 logs
   pm2 describe app-name
   ```

4. **Nginx errors**: Check configuration
   ```bash
   sudo nginx -t
   sudo tail -f /var/log/nginx/error.log
   ```

## Security Checklist

- [ ] Changed default MongoDB credentials
- [ ] Updated JWT_SECRET in production
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Regular backups scheduled
- [ ] PM2 startup configured
- [ ] Environment variables secured

## Support

For issues, check:
- PM2 logs: `pm2 logs`
- Nginx logs: `/var/log/nginx/`
- MongoDB logs: `sudo journalctl -u mongod`
- Application logs: `pm2 logs balsampada-backend`