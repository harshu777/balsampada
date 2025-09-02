const axios = require('axios');

async function testLiveClassCreation() {
  try {
    // First login as teacher
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'baviskarh1234@gmail.com',
      password: 'Test@123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Logged in successfully');
    
    // Get teacher's classes
    const classesResponse = await axios.get('http://localhost:5000/api/classes/teacher', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const classes = classesResponse.data.data;
    console.log(`📚 Found ${classes.length} classes`);
    
    if (classes.length === 0) {
      console.log('❌ No classes found for teacher');
      return;
    }
    
    const firstClass = classes[0];
    console.log(`Using class: ${firstClass.title} (ID: ${firstClass._id})`);
    
    // Create a live class
    const liveClassData = {
      title: 'Test Live Class Session',
      description: 'Testing live class creation',
      classId: firstClass._id,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      duration: 60,
      maxAttendees: 30,
      isRecurring: false
    };
    
    console.log('\nCreating live class with data:', liveClassData);
    
    const createResponse = await axios.post('http://localhost:5000/api/live-classes', liveClassData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Live class created successfully!');
    console.log('Live class details:', {
      id: createResponse.data.data._id,
      title: createResponse.data.data.title,
      meetingUrl: createResponse.data.data.meetingUrl,
      scheduledAt: createResponse.data.data.scheduledAt
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testLiveClassCreation();