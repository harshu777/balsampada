#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API Base URL
API_URL="${API_URL:-http://localhost:5000/api}"

echo "=========================================="
echo "User Registration and Testing Script"
echo "=========================================="

# Check if API is running
echo -e "\n${YELLOW}Checking API health...${NC}"
if curl -s "${API_URL}/health" > /dev/null; then
    echo -e "${GREEN}✓ API is running${NC}"
else
    echo -e "${RED}✗ API is not accessible. Please start the backend server.${NC}"
    exit 1
fi

# Function to register user
register_user() {
    local name=$1
    local email=$2
    local password=$3
    local role=$4
    local phone=$5
    
    echo -e "\n${YELLOW}Registering ${role}: ${name}${NC}"
    
    response=$(curl -s -X POST "${API_URL}/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"${name}\",
            \"email\": \"${email}\",
            \"password\": \"${password}\",
            \"role\": \"${role}\",
            \"phone\": \"${phone}\"
        }")
    
    if echo "$response" | grep -q "success\":true"; then
        echo -e "${GREEN}✓ Successfully registered: ${email}${NC}"
    elif echo "$response" | grep -q "Email already registered"; then
        echo -e "${YELLOW}⚠ User already exists: ${email}${NC}"
    else
        echo -e "${RED}✗ Failed to register: ${email}${NC}"
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    fi
}

# Function to test login
test_login() {
    local email=$1
    local password=$2
    local name=$3
    
    echo -e "\n${YELLOW}Testing login for ${name}${NC}"
    
    response=$(curl -s -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"${email}\",
            \"password\": \"${password}\"
        }")
    
    if echo "$response" | grep -q "success\":true"; then
        echo -e "${GREEN}✓ Login successful for: ${email}${NC}"
        # Extract and display user info
        echo "$response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'user' in data:
    user = data['user']
    print(f'  Name: {user.get(\"name\")}')
    print(f'  Role: {user.get(\"role\")}')
    print(f'  ID: {user.get(\"id\")}')
" 2>/dev/null || true
    else
        echo -e "${RED}✗ Login failed for: ${email}${NC}"
    fi
}

# Main execution
echo -e "\n=========================================="
echo "STEP 1: Register Users"
echo "=========================================="

# Register Teacher - Sonal
register_user "Sonal Sharma" "sonal@teacher.com" "sonal123" "teacher" "9876543210"

# Register Student - Harsh
register_user "Harsh Baviskar" "harsh@student.com" "harsh123" "student" "9876543211"

# Register additional test users
register_user "Priya Patel" "priya@teacher.com" "priya123" "teacher" "9876543212"
register_user "Rahul Kumar" "rahul@student.com" "rahul123" "student" "9876543213"
register_user "Amit Singh" "amit@student.com" "amit123" "student" "9876543214"

echo -e "\n=========================================="
echo "STEP 2: Test Login"
echo "=========================================="

# Test login for main users
test_login "sonal@teacher.com" "sonal123" "Sonal (Teacher)"
test_login "harsh@student.com" "harsh123" "Harsh (Student)"

echo -e "\n=========================================="
echo "SUMMARY"
echo "=========================================="

echo -e "\n${GREEN}Created Users:${NC}"
echo "Teachers:"
echo "  • Sonal Sharma (sonal@teacher.com) - Password: sonal123"
echo "  • Priya Patel (priya@teacher.com) - Password: priya123"
echo ""
echo "Students:"
echo "  • Harsh Baviskar (harsh@student.com) - Password: harsh123"
echo "  • Rahul Kumar (rahul@student.com) - Password: rahul123"
echo "  • Amit Singh (amit@student.com) - Password: amit123"

echo -e "\n${GREEN}How to use:${NC}"
echo "1. Open browser: http://localhost:3000"
echo "2. Click 'Login'"
echo "3. Use any of the credentials above"

echo -e "\n${GREEN}Test with curl:${NC}"
echo "curl -X POST ${API_URL}/auth/login -H \"Content-Type: application/json\" -d '{\"email\":\"sonal@teacher.com\",\"password\":\"sonal123\"}'"
echo "curl -X POST ${API_URL}/auth/login -H \"Content-Type: application/json\" -d '{\"email\":\"harsh@student.com\",\"password\":\"harsh123\"}'"

echo -e "\n${GREEN}✓ Script completed successfully!${NC}"