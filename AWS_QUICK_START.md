# 🚀 AWS Quick Start Guide

## 1️⃣ Launch EC2 Instance (5 minutes)

### AWS Console Steps:
1. **Go to EC2** → Launch Instance
2. **Configure:**
   ```
   Name: balsampada-lms
   OS: Ubuntu 22.04 LTS
   Type: t2.micro (FREE)
   Storage: 30GB (FREE)
   ```
3. **Security Group - Add Rules:**
   - SSH (22) - Your IP
   - HTTP (80) - Anywhere
   - HTTPS (443) - Anywhere
   - Custom TCP (3000) - Anywhere
   - Custom TCP (5000) - Anywhere

4. **Download `.pem` key file**

---

## 2️⃣ Connect & Setup (10 minutes)

```bash
# Local machine
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@[EC2-PUBLIC-IP]

# On EC2 - Quick Install
curl -O https://raw.githubusercontent.com/yourusername/balsampada-lms/main/aws-setup.sh
chmod +x aws-setup.sh
./aws-setup.sh
```

---

## 3️⃣ Upload Your Code (5 minutes)

### Option A: Direct Upload
```bash
# On local machine
scp -i your-key.pem balsampada-lms-aws-deploy.tar.gz ubuntu@[EC2-IP]:~/

# On EC2
cd /var/www
sudo tar -xzf ~/balsampada-lms-aws-deploy.tar.gz -C balsampada-lms/
```

### Option B: Git Clone
```bash
cd /var/www
sudo git clone https://github.com/yourusername/balsampada-lms.git
sudo chown -R ubuntu:ubuntu balsampada-lms
```

---

## 4️⃣ Configure & Deploy (10 minutes)

```bash
cd /var/www/balsampada-lms

# Configure Backend
cp backend/.env.production.template backend/.env.production
nano backend/.env.production
# Update: JWT_SECRET, MONGODB_URI, FRONTEND_URL with EC2 IP

# Configure Frontend  
cp frontend/.env.production.template frontend/.env.production
nano frontend/.env.production
# Update: NEXT_PUBLIC_API_URL with EC2 IP

# Install & Build
cd backend && npm install --production
cd ../frontend && npm install && npm run build

# Start with PM2
cd ..
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 5️⃣ Verify Everything Works

### Check Services:
```bash
# Check apps running
pm2 status

# Check logs
pm2 logs

# Test endpoints
curl http://localhost:5000/api/health
curl http://localhost:3000
```

### Access Your App:
- **Frontend**: `http://[EC2-IP]`
- **API Health**: `http://[EC2-IP]/api/health`
- **Direct Frontend**: `http://[EC2-IP]:3000`
- **Direct Backend**: `http://[EC2-IP]:5000`

---

## 🔒 Security Checklist

```bash
# 1. Change MongoDB password
mongo
> use balsampada-lms
> db.changeUserPassword("lmsadmin", "NEW_SECURE_PASSWORD")

# 2. Generate secure secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For SESSION_SECRET

# 3. Update firewall
sudo ufw status
sudo ufw deny 3000  # Block direct frontend access
sudo ufw deny 5000  # Block direct backend access
sudo ufw reload
```

---

## 🆘 Troubleshooting

### App not loading?
```bash
pm2 restart all
sudo systemctl restart nginx
```

### MongoDB issues?
```bash
sudo systemctl status mongod
sudo systemctl restart mongod
```

### Check logs:
```bash
pm2 logs lms-backend
pm2 logs lms-frontend
tail -f /var/log/nginx/error.log
```

### Port already in use?
```bash
sudo lsof -i :3000
sudo lsof -i :5000
# Kill process if needed
sudo kill -9 [PID]
```

---

## 📊 Monitor Resources

```bash
# Check disk space
df -h

# Check memory
free -h

# Check CPU
top

# PM2 monitoring
pm2 monit
```

---

## 🎯 Success Checklist

- [ ] EC2 instance running
- [ ] Can SSH into instance  
- [ ] MongoDB running
- [ ] PM2 shows both apps "online"
- [ ] Nginx serving on port 80
- [ ] Frontend loads in browser
- [ ] Can register/login users
- [ ] API returns health check

---

## 💡 Pro Tips

1. **Use Elastic IP** for consistent address
2. **Set up CloudWatch** alarms for monitoring
3. **Enable backups** for EBS volume
4. **Use Route 53** for domain management
5. **Set billing alerts** to avoid surprises

---

## 📱 Mobile Testing

Your EC2 IP is accessible from anywhere:
- Share `http://[EC2-IP]` with testers
- Works on mobile devices
- No CORS issues with proper setup

---

## 🔄 Update Deployment

```bash
cd /var/www/balsampada-lms
git pull origin main
cd backend && npm install
cd ../frontend && npm install && npm run build
pm2 restart all
```

---

## 📧 Support

- **AWS Support**: Check AWS Console
- **Free Tier Usage**: Billing Dashboard
- **Server Monitoring**: CloudWatch
- **Logs**: PM2 and Nginx logs

---

**Your app should be live in ~30 minutes! 🎉**

**EC2 Public DNS**: `http://ec2-[IP].compute-1.amazonaws.com`
**Direct IP**: `http://[YOUR-EC2-IP]`