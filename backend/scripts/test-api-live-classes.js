const axios = require('axios');
require('dotenv').config();

async function testLiveClassesAPI() {
  try {
    // Login as student
    console.log('1️⃣ Logging in as student...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'hbaviskar1106@gmail.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Logged in successfully');
    console.log('User:', loginResponse.data.user.name, '(', loginResponse.data.user.role, ')');
    
    // Get live classes
    console.log('\n2️⃣ Fetching live classes...');
    const liveClassesResponse = await axios.get('http://localhost:5000/api/live-classes', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const liveClasses = liveClassesResponse.data.data;
    console.log(`✅ Received ${liveClasses.length} live classes`);
    
    if (liveClasses.length > 0) {
      console.log('\n📚 Live Classes:');
      liveClasses.slice(0, 5).forEach(lc => {
        console.log(`  - ${lc.title}`);
        console.log(`    Class: ${lc.class?.title || lc.class}`);
        console.log(`    Status: ${lc.status}`);
        console.log(`    Scheduled: ${new Date(lc.scheduledAt).toLocaleString()}`);
      });
    }
    
    // Also test enrollments endpoint
    console.log('\n3️⃣ Fetching enrollments...');
    const enrollmentsResponse = await axios.get('http://localhost:5000/api/enrollments/my-enrollments', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const enrollments = enrollmentsResponse.data.data;
    console.log(`✅ Student has ${enrollments.length} enrollments`);
    enrollments.forEach(e => {
      console.log(`  - ${e.class?.title} (Status: ${e.status})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testLiveClassesAPI();