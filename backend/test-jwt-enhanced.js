/**
 * Test script for enhanced JWT implementation
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test user credentials
const testUser = {
  email: 'harsh@student.com',
  password: 'harsh123'
};

// Store for tokens
let accessToken = null;
let refreshToken = null;

// Helper function to sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

// Test functions
async function testLogin() {
  console.log(`\n${colors.blue}1. Testing Login...${colors.reset}`);
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, testUser);
    
    if (response.data.success && response.data.tokens) {
      accessToken = response.data.tokens.access.token;
      refreshToken = response.data.tokens.refresh.token;
      
      console.log(`${colors.green}✅ Login successful${colors.reset}`);
      console.log(`   User: ${response.data.user.name} (${response.data.user.role})`);
      console.log(`   Access Token: ${accessToken.substring(0, 20)}...`);
      console.log(`   Refresh Token: ${refreshToken.substring(0, 20)}...`);
      console.log(`   Access Expires: ${response.data.tokens.access.expiresAt}`);
      console.log(`   Refresh Expires: ${response.data.tokens.refresh.expiresAt}`);
      
      return true;
    } else {
      // Fallback for old auth system
      if (response.data.success && response.data.token) {
        console.log(`${colors.yellow}⚠️  Using old auth system (single token)${colors.reset}`);
        accessToken = response.data.token;
        return true;
      }
    }
    
    console.log(`${colors.red}❌ Login failed: Unexpected response format${colors.reset}`);
    return false;
  } catch (error) {
    console.log(`${colors.red}❌ Login failed: ${error.response?.data?.message || error.message}${colors.reset}`);
    return false;
  }
}

async function testProtectedRoute() {
  console.log(`\n${colors.blue}2. Testing Protected Route...${colors.reset}`);
  
  try {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log(`${colors.green}✅ Protected route accessible${colors.reset}`);
    console.log(`   User ID: ${response.data.data._id}`);
    console.log(`   Name: ${response.data.data.name}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Protected route failed: ${error.response?.data?.message || error.message}${colors.reset}`);
    return false;
  }
}

async function testTokenRefresh() {
  console.log(`\n${colors.blue}3. Testing Token Refresh...${colors.reset}`);
  
  if (!refreshToken) {
    console.log(`${colors.yellow}⚠️  No refresh token available (old auth system)${colors.reset}`);
    return false;
  }
  
  try {
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken: refreshToken
    });
    
    if (response.data.success && response.data.accessToken) {
      const oldAccessToken = accessToken;
      accessToken = response.data.accessToken;
      
      console.log(`${colors.green}✅ Token refresh successful${colors.reset}`);
      console.log(`   Old Access Token: ${oldAccessToken.substring(0, 20)}...`);
      console.log(`   New Access Token: ${accessToken.substring(0, 20)}...`);
      console.log(`   New Expiry: ${response.data.accessTokenExpiry}`);
      return true;
    }
    
    console.log(`${colors.red}❌ Token refresh failed: Unexpected response${colors.reset}`);
    return false;
  } catch (error) {
    console.log(`${colors.red}❌ Token refresh failed: ${error.response?.data?.message || error.message}${colors.reset}`);
    return false;
  }
}

async function testGetSessions() {
  console.log(`\n${colors.blue}4. Testing Get Sessions...${colors.reset}`);
  
  try {
    const response = await axios.get(`${API_URL}/auth/sessions`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (response.data.success && response.data.sessions) {
      console.log(`${colors.green}✅ Sessions retrieved successfully${colors.reset}`);
      console.log(`   Active Sessions: ${response.data.sessions.length}`);
      
      response.data.sessions.forEach((session, index) => {
        console.log(`   Session ${index + 1}:`);
        console.log(`     ID: ${session.id}`);
        console.log(`     Created: ${session.createdAt}`);
        console.log(`     User Agent: ${session.userAgent || 'N/A'}`);
      });
      return true;
    }
    
    console.log(`${colors.red}❌ Get sessions failed: Unexpected response${colors.reset}`);
    return false;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`${colors.yellow}⚠️  Sessions endpoint not available (old auth system)${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Get sessions failed: ${error.response?.data?.message || error.message}${colors.reset}`);
    }
    return false;
  }
}

async function testLogout() {
  console.log(`\n${colors.blue}5. Testing Logout...${colors.reset}`);
  
  try {
    const response = await axios.post(`${API_URL}/auth/logout`, 
      refreshToken ? { refreshToken } : {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    console.log(`${colors.green}✅ Logout successful${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Logout failed: ${error.response?.data?.message || error.message}${colors.reset}`);
    return false;
  }
}

async function testAccessAfterLogout() {
  console.log(`\n${colors.blue}6. Testing Access After Logout...${colors.reset}`);
  
  try {
    await axios.get(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log(`${colors.red}❌ ERROR: Token still valid after logout!${colors.reset}`);
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`${colors.green}✅ Token correctly invalidated after logout${colors.reset}`);
      return true;
    }
    console.log(`${colors.red}❌ Unexpected error: ${error.message}${colors.reset}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}    Enhanced JWT Authentication Test Suite${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  
  const results = {
    login: false,
    protectedRoute: false,
    tokenRefresh: false,
    sessions: false,
    logout: false,
    postLogout: false
  };
  
  // Run tests in sequence
  results.login = await testLogin();
  
  if (results.login) {
    await sleep(1000);
    results.protectedRoute = await testProtectedRoute();
    
    await sleep(1000);
    results.tokenRefresh = await testTokenRefresh();
    
    await sleep(1000);
    results.sessions = await testGetSessions();
    
    await sleep(1000);
    results.logout = await testLogout();
    
    await sleep(1000);
    results.postLogout = await testAccessAfterLogout();
  }
  
  // Print summary
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}    Test Results Summary${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  
  let passed = 0;
  let failed = 0;
  
  Object.entries(results).forEach(([test, result]) => {
    const testName = test.replace(/([A-Z])/g, ' $1').trim();
    const status = result ? `${colors.green}✅ PASSED${colors.reset}` : `${colors.red}❌ FAILED${colors.reset}`;
    console.log(`${testName}: ${status}`);
    
    if (result) passed++;
    else failed++;
  });
  
  console.log(`\n${colors.blue}Total: ${passed} passed, ${failed} failed${colors.reset}`);
  
  if (failed === 0) {
    console.log(`${colors.green}🎉 All tests passed! JWT enhancement is working correctly.${colors.reset}`);
  } else if (passed > 3) {
    console.log(`${colors.yellow}⚠️  Most features working. Some enhancement features may not be available.${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ JWT enhancement not fully functional. Check Redis and configuration.${colors.reset}`);
  }
}

// Check if server is running
axios.get(`${API_URL}/health`)
  .then(() => {
    console.log(`${colors.green}✅ Server is running${colors.reset}`);
    runTests();
  })
  .catch(() => {
    console.log(`${colors.red}❌ Server is not running. Start it with: npm run dev${colors.reset}`);
    process.exit(1);
  });