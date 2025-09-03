#!/bin/bash

# Database Backup Script for Balsampada LMS
# Usage: ./scripts/backup-database.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}     Balsampada LMS - Database Backup Tool${NC}"
echo -e "${GREEN}==================================================${NC}\n"

# Set variables
DB_NAME="balsampada-lms"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="database-backups"
BACKUP_PATH="${BACKUP_DIR}/backup-${TIMESTAMP}"

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

echo -e "${YELLOW}📦 Creating backup...${NC}"
echo -e "Database: ${DB_NAME}"
echo -e "Backup path: ${BACKUP_PATH}\n"

# Create the backup
mongodump --db ${DB_NAME} --out ${BACKUP_PATH}

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Backup created successfully!${NC}"
    
    # Create a compressed archive
    echo -e "${YELLOW}🗜️  Compressing backup...${NC}"
    tar -czf "${BACKUP_PATH}.tar.gz" -C ${BACKUP_DIR} "backup-${TIMESTAMP}"
    
    if [ $? -eq 0 ]; then
        # Remove uncompressed backup
        rm -rf ${BACKUP_PATH}
        echo -e "${GREEN}✅ Compressed backup created: ${BACKUP_PATH}.tar.gz${NC}"
        
        # Show file size
        SIZE=$(du -h "${BACKUP_PATH}.tar.gz" | cut -f1)
        echo -e "\n📊 Backup size: ${SIZE}"
        
        # List all backups
        echo -e "\n${YELLOW}📁 All backups:${NC}"
        ls -lh ${BACKUP_DIR}/*.tar.gz 2>/dev/null | tail -5
        
        echo -e "\n${GREEN}==================================================${NC}"
        echo -e "${GREEN}✨ Backup Complete!${NC}"
        echo -e "\nTo restore this backup later, use:"
        echo -e "${YELLOW}tar -xzf ${BACKUP_PATH}.tar.gz -C ${BACKUP_DIR}${NC}"
        echo -e "${YELLOW}mongorestore --db ${DB_NAME} --drop ${BACKUP_PATH}/${DB_NAME}${NC}"
        echo -e "${GREEN}==================================================${NC}"
    else
        echo -e "${RED}❌ Failed to compress backup${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi