# 🚀 AWS Deployment Guide for Balsampada LMS

## 📋 Prerequisites

- AWS Account with Free Tier eligibility
- Domain name (optional, can use EC2 public IP initially)
- Basic knowledge of SSH and terminal commands

---

## 🎯 Step 1: Launch EC2 Instance

### 1.1 Login to AWS Console
1. Go to [AWS Console](https://console.aws.amazon.com)
2. Navigate to **EC2 Dashboard**

### 1.2 Launch Instance
1. Click **"Launch Instance"**
2. Configure:
   - **Name**: `balsampada-lms-server`
   - **AMI**: Ubuntu Server 22.04 LTS (64-bit x86)
   - **Instance Type**: `t2.micro` (Free tier eligible)
   - **Key Pair**: Create new or use existing
   - **Network Settings**:
     - Allow SSH (22)
     - Allow HTTP (80)
     - Allow HTTPS (443)
   - **Storage**: 30 GB gp3 (Free tier)

### 1.3 Security Group Rules
Add these inbound rules:
```
Type        Protocol    Port Range    Source
SSH         TCP        22            My IP
HTTP        TCP        80            0.0.0.0/0
HTTPS       TCP        443           0.0.0.0/0
Custom TCP  TCP        3000          0.0.0.0/0 (temporary)
Custom TCP  TCP        5000          0.0.0.0/0 (temporary)
```

---

## 🔧 Step 2: Connect to EC2 Instance

### 2.1 Set Permissions for Key File
```bash
chmod 400 your-key-file.pem
```

### 2.2 Connect via SSH
```bash
ssh -i your-key-file.pem ubuntu@your-ec2-public-ip
```

---

## 📦 Step 3: Run Setup Script

### 3.1 Upload Setup Script
```bash
# From your local machine
scp -i your-key-file.pem aws-setup.sh ubuntu@your-ec2-ip:~/
```

### 3.2 Run Setup
```bash
# On EC2 instance
chmod +x aws-setup.sh
./aws-setup.sh
```

---

## 🔐 Step 4: Configure Environment

### 4.1 Backend Configuration
```bash
sudo nano /var/www/balsampada-lms/backend/.env.production
```

Update these critical values:
```env
JWT_SECRET=generate-very-strong-secret-here-use-openssl
SESSION_SECRET=another-very-strong-secret-here
MONGODB_URI=mongodb://lmsadmin:YourSecurePassword@localhost:27017/balsampada-lms
FRONTEND_URL=http://your-ec2-ip-or-domain
```

### 4.2 Frontend Configuration
```bash
sudo nano /var/www/balsampada-lms/frontend/.env.production
```

Update:
```env
NEXT_PUBLIC_API_URL=http://your-ec2-ip-or-domain/api
```

---

## 📂 Step 5: Deploy Application

### 5.1 Option A: Upload Files via SCP
```bash
# From local machine
# Compress project (exclude node_modules)
tar -czf lms-deploy.tar.gz --exclude=node_modules --exclude=.git backend frontend

# Upload
scp -i your-key.pem lms-deploy.tar.gz ubuntu@your-ec2-ip:~/

# On EC2
cd /var/www/balsampada-lms
tar -xzf ~/lms-deploy.tar.gz
```

### 5.2 Option B: Clone from GitHub
```bash
cd /var/www
sudo rm -rf balsampada-lms
git clone https://github.com/yourusername/balsampada-lms.git
cd balsampada-lms
```

### 5.3 Install Dependencies
```bash
# Backend
cd /var/www/balsampada-lms/backend
npm ci --production

# Frontend
cd /var/www/balsampada-lms/frontend
npm ci
npm run build
```

---

## 🚀 Step 6: Start Applications

### 6.1 Start with PM2
```bash
cd /var/www/balsampada-lms
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### 6.2 Verify Services
```bash
# Check PM2 processes
pm2 status

# Check Nginx
sudo systemctl status nginx

# Check MongoDB
sudo systemctl status mongod

# Check logs
pm2 logs
```

---

## 🌐 Step 7: Configure Domain (Optional)

### 7.1 Point Domain to EC2
1. Go to your domain registrar
2. Add A record: `@` → Your EC2 Elastic IP
3. Add A record: `www` → Your EC2 Elastic IP

### 7.2 Update Nginx
```bash
sudo nano /etc/nginx/sites-available/balsampada-lms
```

Replace `server_name _;` with:
```nginx
server_name yourdomain.com www.yourdomain.com;
```

### 7.3 Install SSL Certificate
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 📊 Step 8: Monitoring & Maintenance

### 8.1 View Application Logs
```bash
# PM2 logs
pm2 logs lms-backend
pm2 logs lms-frontend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 8.2 Monitor System
```bash
# Run monitoring script
/var/www/balsampada-lms/monitor.sh

# Check disk usage
df -h

# Check memory
free -h

# Check processes
htop
```

### 8.3 Backup Data
```bash
# Manual backup
/var/www/balsampada-lms/backup.sh

# Check scheduled backups
crontab -l
```

---

## 🔄 Step 9: Deployment Updates

### 9.1 Deploy New Code
```bash
cd /var/www/balsampada-lms
git pull origin main
./deploy.sh
```

### 9.2 Restart Services
```bash
# Restart applications
pm2 restart all

# Restart Nginx
sudo systemctl restart nginx

# Restart MongoDB if needed
sudo systemctl restart mongod
```

---

## 🛡️ Step 10: Security Hardening

### 10.1 Create IAM User (Don't use root)
1. Go to IAM in AWS Console
2. Create user with EC2 access only
3. Use IAM credentials for AWS CLI

### 10.2 Setup Fail2ban
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 10.3 Configure Automatic Updates
```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### 10.4 MongoDB Security
```bash
# Enable authentication
sudo nano /etc/mongod.conf

# Add:
security:
  authorization: enabled

# Restart
sudo systemctl restart mongod
```

---

## 💰 Cost Optimization

### Free Tier Limits (12 months)
- **EC2**: 750 hours/month t2.micro
- **Storage**: 30 GB EBS
- **Data Transfer**: 15 GB/month

### After Free Tier
- **Estimated Cost**: $10-15/month
- **Use Reserved Instances**: Save up to 72%
- **Stop instance when not needed**: No charge when stopped

### Cost Saving Tips
1. Use CloudFlare (free CDN)
2. Compress images
3. Enable Nginx caching
4. Use AWS Budget Alerts

---

## 🚨 Troubleshooting

### Application Not Loading
```bash
# Check PM2 status
pm2 status
pm2 restart all

# Check Nginx
sudo nginx -t
sudo systemctl restart nginx

# Check ports
sudo netstat -tlnp
```

### MongoDB Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check logs
sudo tail -f /var/log/mongodb/mongod.log

# Restart MongoDB
sudo systemctl restart mongod
```

### High Memory Usage
```bash
# Check memory
free -h

# Restart PM2 apps
pm2 restart all

# Clear cache
sync && echo 3 | sudo tee /proc/sys/vm/drop_caches
```

---

## 📞 Support Resources

- **AWS Support**: [AWS Support Center](https://console.aws.amazon.com/support)
- **AWS Free Tier**: [Free Tier Usage](https://console.aws.amazon.com/billing/home#/freetier)
- **MongoDB Docs**: [MongoDB Documentation](https://docs.mongodb.com)
- **PM2 Docs**: [PM2 Documentation](https://pm2.keymetrics.io)

---

## ✅ Deployment Checklist

- [ ] EC2 instance launched
- [ ] Security groups configured
- [ ] Setup script executed
- [ ] MongoDB secured with password
- [ ] Environment variables updated
- [ ] Application deployed and built
- [ ] PM2 processes running
- [ ] Nginx configured
- [ ] Domain pointed (optional)
- [ ] SSL certificate installed (optional)
- [ ] Backups scheduled
- [ ] Monitoring setup
- [ ] Security hardening applied

---

## 🎉 Success Indicators

Your deployment is successful when:
1. ✅ Frontend loads at `http://your-ec2-ip:3000`
2. ✅ API responds at `http://your-ec2-ip:5000/api/health`
3. ✅ Nginx proxy works at `http://your-ec2-ip`
4. ✅ PM2 shows all processes "online"
5. ✅ MongoDB connection successful
6. ✅ Users can register and login

---

## 📝 Notes

- Keep your `.pem` file secure
- Regularly update system packages
- Monitor AWS billing dashboard
- Set up CloudWatch alarms for critical metrics
- Consider using Elastic IP for consistent addressing
- Enable AWS backup for EBS volumes

---

**Happy Deploying! 🚀**