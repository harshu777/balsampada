#!/bin/bash

# JSON Export Script for Balsampada LMS
# Creates human-readable JSON exports of the database

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}     Balsampada LMS - JSON Database Export${NC}"
echo -e "${GREEN}==================================================${NC}\n"

# Set variables
DB_NAME="balsampada-lms"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
EXPORT_DIR="database-exports"
EXPORT_PATH="${EXPORT_DIR}/export-${TIMESTAMP}"

# Create export directory
mkdir -p ${EXPORT_PATH}

# Collections to export
COLLECTIONS=("users" "classes" "enrollments" "assignments" "liveclasses" "studymaterials" "grades" "organizations" "payments" "subjects" "studentgroups" "notifications")

echo -e "${YELLOW}📤 Exporting collections to JSON...${NC}\n"

# Export each collection
for collection in "${COLLECTIONS[@]}"; do
    echo -e "Exporting ${collection}..."
    mongoexport --db ${DB_NAME} --collection ${collection} --out "${EXPORT_PATH}/${collection}.json" --pretty 2>/dev/null
done

echo -e "\n${GREEN}✅ Export completed!${NC}"

# Create a summary file
echo -e "\n${YELLOW}📊 Creating summary...${NC}"
cat > "${EXPORT_PATH}/summary.txt" << EOF
Balsampada LMS Database Export
===============================
Date: $(date)
Database: ${DB_NAME}

Collection Summary:
-------------------
EOF

for collection in "${COLLECTIONS[@]}"; do
    if [ -f "${EXPORT_PATH}/${collection}.json" ]; then
        COUNT=$(grep -c "\"_id\"" "${EXPORT_PATH}/${collection}.json" 2>/dev/null || echo "0")
        SIZE=$(du -h "${EXPORT_PATH}/${collection}.json" | cut -f1)
        echo "${collection}: ${COUNT} documents (${SIZE})" >> "${EXPORT_PATH}/summary.txt"
    fi
done

# Show summary
echo -e "${GREEN}📄 Export Summary:${NC}"
cat "${EXPORT_PATH}/summary.txt"

# Create zip file
echo -e "\n${YELLOW}🗜️  Creating zip file...${NC}"
zip -r "${EXPORT_PATH}.zip" "${EXPORT_PATH}" -q

if [ $? -eq 0 ]; then
    SIZE=$(du -h "${EXPORT_PATH}.zip" | cut -f1)
    echo -e "${GREEN}✅ Zip file created: ${EXPORT_PATH}.zip (${SIZE})${NC}"
    
    # Clean up uncompressed files
    rm -rf ${EXPORT_PATH}
    
    echo -e "\n${GREEN}==================================================${NC}"
    echo -e "${GREEN}✨ Export Complete!${NC}"
    echo -e "\nExported to: ${EXPORT_PATH}.zip"
    echo -e "To view the data, unzip and open the JSON files."
    echo -e "${GREEN}==================================================${NC}"
else
    echo -e "${RED}❌ Failed to create zip file${NC}"
fi