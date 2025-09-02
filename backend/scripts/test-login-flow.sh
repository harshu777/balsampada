#!/bin/bash

# Test login flow script
API_URL="http://localhost:5000/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "=========================================="
echo "Testing Login Flow"
echo "=========================================="

# Test Teacher Login
echo -e "\n${GREEN}Testing Teacher Login (Sonal)${NC}"
RESPONSE=$(curl -s -X POST ${API_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sonal@teacher.com","password":"sonal123"}')

if echo "$RESPONSE" | grep -q "token"; then
  TOKEN=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")
  echo "✅ Login successful"
  echo "Token received (first 20 chars): ${TOKEN:0:20}..."
  
  # Test authenticated endpoint
  echo -e "\n${GREEN}Testing authenticated endpoint with token${NC}"
  CLASSES=$(curl -s -X GET ${API_URL}/classes/teacher \
    -H "Authorization: Bearer ${TOKEN}")
  
  if echo "$CLASSES" | grep -q "success"; then
    echo "✅ Authenticated API call successful"
  else
    echo "❌ Authenticated API call failed"
    echo "$CLASSES"
  fi
else
  echo "❌ Login failed"
  echo "$RESPONSE"
fi

# Test Student Login
echo -e "\n${GREEN}Testing Student Login (Harsh)${NC}"
RESPONSE=$(curl -s -X POST ${API_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"harsh@student.com","password":"harsh123"}')

if echo "$RESPONSE" | grep -q "token"; then
  echo "✅ Login successful"
  TOKEN=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")
  echo "Token received (first 20 chars): ${TOKEN:0:20}..."
else
  echo "❌ Login failed"
fi

echo -e "\n=========================================="
echo "Test Complete"
echo "=========================================="
echo ""
echo "To test in browser:"
echo "1. Go to http://localhost:3000/login"
echo "2. Login with sonal@teacher.com / sonal123"
echo "3. You'll be redirected to the dashboard"
echo "4. All API calls will work correctly when authenticated"