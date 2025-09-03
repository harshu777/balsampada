#!/bin/bash

# Docker Build and Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

# Default values
ENV_FILE=".env"
COMPOSE_FILE="docker-compose.yml"
BUILD_TARGET="production"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dev)
            BUILD_TARGET="dev"
            COMPOSE_FILE="docker-compose.yml -f docker-compose.dev.yml"
            shift
            ;;
        --prod)
            BUILD_TARGET="production"
            shift
            ;;
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        --help)
            echo "Usage: ./docker-build.sh [options]"
            echo "Options:"
            echo "  --dev       Build for development with hot reload"
            echo "  --prod      Build for production (default)"
            echo "  --clean     Clean build (remove volumes and rebuild)"
            echo "  --help      Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}  Balsampada LMS Docker Build${NC}"
echo -e "${BLUE}==================================${NC}"

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    cp .env.docker .env
    
    # Generate secure secrets
    JWT_ACCESS_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    SESSION_SECRET=$(openssl rand -base64 32 | tr -d '\n')
    MONGO_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
    REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
    
    # Update .env with generated secrets
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/JWT_ACCESS_SECRET=.*/JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}/" .env
        sed -i '' "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}/" .env
        sed -i '' "s/SESSION_SECRET=.*/SESSION_SECRET=${SESSION_SECRET}/" .env
        sed -i '' "s/MONGO_ROOT_PASSWORD=.*/MONGO_ROOT_PASSWORD=${MONGO_PASSWORD}/" .env
        sed -i '' "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=${REDIS_PASSWORD}/" .env
    else
        # Linux
        sed -i "s/JWT_ACCESS_SECRET=.*/JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}/" .env
        sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}/" .env
        sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=${SESSION_SECRET}/" .env
        sed -i "s/MONGO_ROOT_PASSWORD=.*/MONGO_ROOT_PASSWORD=${MONGO_PASSWORD}/" .env
        sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=${REDIS_PASSWORD}/" .env
    fi
    
    echo -e "${GREEN}✅ Generated secure secrets in .env${NC}"
    echo -e "${YELLOW}⚠️  Please update other configuration values in .env as needed${NC}"
fi

# Source environment variables
export $(grep -v '^#' .env | xargs)

# Clean build if requested
if [ "$CLEAN_BUILD" = true ]; then
    echo -e "${YELLOW}🧹 Cleaning existing containers and volumes...${NC}"
    docker-compose down -v
    docker system prune -f
fi

# Create necessary directories
echo -e "${BLUE}📁 Creating necessary directories...${NC}"
mkdir -p backend/logs backend/uploads nginx/conf.d nginx/ssl

# Create nginx configuration if not exists
if [ ! -f "nginx/conf.d/default.conf" ]; then
    echo -e "${BLUE}📝 Creating Nginx configuration...${NC}"
    cat > nginx/conf.d/default.conf << 'EOF'
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

upstream backend {
    least_conn;
    server backend:5000;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name localhost;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API proxy
    location /api {
        limit_req zone=api_limit burst=20 nodelay;
        
        # Auth endpoints with stricter limits
        location ~ ^/api/auth/(login|register|refresh) {
            limit_req zone=auth_limit burst=5 nodelay;
            proxy_pass http://backend;
        }
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend proxy
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
fi

# Build and start containers
echo -e "${BLUE}🏗️  Building Docker images...${NC}"
docker-compose -f $COMPOSE_FILE build --build-arg BUILD_TARGET=$BUILD_TARGET

echo -e "${BLUE}🚀 Starting containers...${NC}"
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to be healthy...${NC}"
sleep 5

# Check service health
echo -e "${BLUE}🏥 Checking service health...${NC}"
services=("mongodb" "redis" "backend" "frontend")
all_healthy=true

for service in "${services[@]}"; do
    if docker-compose ps | grep $service | grep -q "healthy\|Up"; then
        echo -e "${GREEN}✅ $service is healthy${NC}"
    else
        echo -e "${RED}❌ $service is not healthy${NC}"
        all_healthy=false
    fi
done

if [ "$all_healthy" = true ]; then
    echo -e "${GREEN}==================================${NC}"
    echo -e "${GREEN}  🎉 All services are running!${NC}"
    echo -e "${GREEN}==================================${NC}"
    echo ""
    echo "Access points:"
    echo "  Frontend:      http://localhost:${FRONTEND_PORT:-3000}"
    echo "  Backend API:   http://localhost:${BACKEND_PORT:-5000}"
    
    if [ "$BUILD_TARGET" = "dev" ]; then
        echo "  Mongo Express: http://localhost:8081 (admin/admin123)"
        echo "  Redis Commander: http://localhost:8082"
    fi
    
    echo ""
    echo "Useful commands:"
    echo "  View logs:     docker-compose logs -f [service]"
    echo "  Stop all:      docker-compose down"
    echo "  Clean all:     docker-compose down -v"
    echo "  Rebuild:       ./docker-build.sh --clean"
else
    echo -e "${RED}⚠️  Some services failed to start. Check logs:${NC}"
    echo "  docker-compose logs [service]"
    exit 1
fi