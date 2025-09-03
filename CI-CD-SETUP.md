# 🚀 CI/CD Setup Guide for Balsampada LMS

This guide will help you set up the complete CI/CD pipeline for your containerized application.

## 📋 Prerequisites

1. **GitHub Repository** ✅ (Already done)
2. **Docker Hub Account** (Free at hub.docker.com)
3. **Server/Cloud Provider** (AWS EC2, DigitalOcean, etc.)

## 🔧 Setup Steps

### Step 1: Create Docker Hub Account

1. Go to [Docker Hub](https://hub.docker.com)
2. Sign up for a free account
3. Create two repositories:
   - `harsh1106/balsampada-backend` ✅ 
   - `harsh1106/balsampada-frontend` ✅

### Step 2: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

#### Docker Hub Secrets (Required)
```
DOCKER_USERNAME: harsh1106
DOCKER_PASSWORD: your-dockerhub-password-or-access-token
```

#### Server Secrets (For Deployment)
```
# Staging Server
STAGING_HOST: your-staging-server-ip
STAGING_USER: ubuntu
STAGING_SSH_KEY: (paste your private SSH key)

# Production Server
PRODUCTION_HOST: your-production-server-ip
PRODUCTION_USER: ubuntu
PRODUCTION_SSH_KEY: (paste your private SSH key)
PRODUCTION_API_URL: https://api.yourdomain.com
```

#### Optional Secrets
```
# Slack Notifications
SLACK_WEBHOOK: your-slack-webhook-url

# Security Scanning
SNYK_TOKEN: your-snyk-token
```

### Step 3: Prepare Your Servers

SSH into your servers and run:

```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create app directory
sudo mkdir -p /var/www/balsampada
sudo chown -R ubuntu:ubuntu /var/www/balsampada
cd /var/www/balsampada

# Copy docker-compose and .env files
# You'll need to manually create these with your production values
```

### Step 4: Create Production docker-compose

On your production server, create `/var/www/balsampada/docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - app-network

  backend:
    image: ${BACKEND_IMAGE:-harsh1106/balsampada-backend:latest}
    restart: unless-stopped
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://${MONGO_USER}:${MONGO_PASSWORD}@mongodb:27017/balsampada?authSource=admin
      REDIS_URL: redis://default:${REDIS_PASSWORD}@redis:6379
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    depends_on:
      - mongodb
      - redis
    networks:
      - app-network

  frontend:
    image: ${FRONTEND_IMAGE:-harsh1106/balsampada-frontend:latest}
    restart: unless-stopped
    ports:
      - "80:3000"
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}
    depends_on:
      - backend
    networks:
      - app-network

volumes:
  mongodb_data:
  redis_data:

networks:
  app-network:
```

## 🚦 Workflow Triggers

The CI/CD pipeline triggers on:

1. **Push to `main`** → Deploy to Production
2. **Push to `develop`** → Deploy to Staging
3. **Pull Request** → Run tests and checks
4. **Manual trigger** → Available in Actions tab

## 📊 Pipeline Stages

### 1. Test Stage
- Runs unit tests
- Checks code quality
- Validates build

### 2. Build Stage
- Builds Docker images
- Pushes to Docker Hub
- Tags with branch/SHA

### 3. Deploy Stage
- Pulls latest images
- Updates services
- Performs health checks

### 4. Security Stage
- Vulnerability scanning
- Dependency checks
- Security reports

## 🔒 Security Best Practices

1. **Never commit secrets** - Use GitHub Secrets
2. **Use specific image tags** - Not just `latest`
3. **Enable branch protection** - Require PR reviews
4. **Rotate secrets regularly** - Update every 90 days
5. **Use least privilege** - Minimal server permissions

## 🎯 Deployment Strategies

### Blue-Green Deployment
```bash
# Deploy to blue environment
docker-compose -p blue up -d

# Switch traffic
# Update nginx/load balancer

# Remove green environment
docker-compose -p green down
```

### Rolling Update (Default)
```bash
# Scale up new version
docker-compose up -d --scale backend=2

# Remove old containers
docker-compose up -d --no-deps backend
```

### Canary Deployment
Use with load balancer to gradually shift traffic

## 🛠️ Troubleshooting

### Pipeline Fails at Test
```bash
# Check test logs in GitHub Actions
# Run tests locally:
npm test
```

### Docker Push Fails
```bash
# Verify Docker Hub credentials
# Check repository names match
```

### Deployment Fails
```bash
# SSH to server and check:
docker-compose logs
docker ps -a
```

## 📈 Monitoring

### GitHub Actions
- View runs: Actions tab in repo
- Download artifacts
- Re-run failed jobs

### Docker Hub
- View image tags
- Check pull counts
- Scan for vulnerabilities

### Server Monitoring
```bash
# Check container status
docker ps

# View logs
docker-compose logs -f backend

# Monitor resources
docker stats
```

## 🔄 Rollback Process

If deployment fails:

```bash
# On production server
cd /var/www/balsampada

# Rollback to previous version
docker-compose down
export BACKEND_IMAGE=harsh1106/balsampada-backend:previous-tag
export FRONTEND_IMAGE=harsh1106/balsampada-frontend:previous-tag
docker-compose up -d

# Restore database if needed
docker-compose exec mongodb mongorestore /backup/[backup-date]
```

## 📝 Next Steps

1. ✅ Push this CI/CD setup to GitHub
2. ✅ Configure GitHub Secrets
3. ✅ Set up Docker Hub
4. ✅ Prepare servers
5. ✅ Make a test commit to trigger pipeline
6. ✅ Monitor first deployment

## 🎉 Success Indicators

- Green checkmarks in GitHub Actions
- Images appearing in Docker Hub
- Services running on servers
- Health checks passing
- Application accessible via browser

---

**Need Help?** 
- GitHub Actions: [docs.github.com/actions](https://docs.github.com/actions)
- Docker Hub: [docs.docker.com/docker-hub](https://docs.docker.com/docker-hub)
- Issues: Create an issue in your repository