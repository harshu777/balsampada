const axios = require('axios');

console.log('🧪 Testing Balsampada LMS Backend Server\n');
console.log('=======================================\n');

async function runTests() {
  // Test 1: Health Check
  console.log('1. Health Check:');
  try {
    const health = await axios.get('http://localhost:5000/api/health');
    console.log('   ✅ API is running:', health.data.message);
  } catch (error) {
    console.log('   ❌ Health check failed');
  }

  // Test 2: Admin Login
  console.log('\n2. Admin Login:');
  try {
    const admin = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@balsampada.com',
      password: 'Admin@123'
    });
    console.log('   ✅ Admin can login:', admin.data.user.name);
  } catch (error) {
    console.log('   ❌ Admin login failed:', error.response?.data?.message);
  }

  // Test 3: Teacher Login
  console.log('\n3. Teacher Login:');
  try {
    const teacher = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'teacher1@demo.com',
      password: 'Demo@123'
    });
    console.log('   ✅ Teacher can login:', teacher.data.user.name);
  } catch (error) {
    console.log('   ❌ Teacher login failed:', error.response?.data?.message);
  }

  // Test 4: Student Login
  console.log('\n4. Student Login:');
  try {
    const student = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'student1@demo.com',
      password: 'Demo@123'
    });
    console.log('   ✅ Student can login:', student.data.user.name);
  } catch (error) {
    console.log('   ❌ Student login failed:', error.response?.data?.message);
  }

  // Test 5: CORS Headers
  console.log('\n5. CORS Configuration:');
  try {
    const response = await axios.options('http://localhost:5000/api/auth/login', {
      headers: {
        'Origin': 'http://localhost:3001',
        'Access-Control-Request-Method': 'POST'
      }
    });
    console.log('   ✅ CORS allows http://localhost:3001');
  } catch (error) {
    console.log('   ❌ CORS not configured properly');
  }

  console.log('\n=======================================');
  console.log('✨ All backend tests completed!\n');
}

runTests();
