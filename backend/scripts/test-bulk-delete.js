const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function testBulkDelete() {
  console.log('🧪 Testing Bulk Delete Feature for Live Classes\n');
  console.log('='.repeat(60));
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Login as teacher
    console.log('1. Logging in as teacher...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'teacher1@demo.com',
      password: 'password123'
    });
    
    const teacherToken = loginRes.data.token;
    console.log('✅ Teacher logged in successfully');
    
    // Get teacher's classes
    console.log('\n2. Getting teacher classes...');
    const classRes = await axios.get(`${API_URL}/classes/teacher`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    
    if (classRes.data.data.length === 0) {
      console.log('❌ No classes found for teacher');
      return;
    }
    
    const classId = classRes.data.data[0]._id;
    console.log(`✅ Found class: ${classRes.data.data[0].name}`);
    
    // Create multiple test live classes
    console.log('\n3. Creating test live classes...');
    const testClasses = [];
    
    for (let i = 1; i <= 3; i++) {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + i);
      
      const testClass = {
        title: `Test Bulk Delete Class ${i}`,
        description: `Test class ${i} for bulk delete testing`,
        classId: classId,
        scheduledAt: scheduledDate.toISOString(),
        duration: 60,
        meetingUrl: `https://meet.jit.si/test-bulk-${i}`
      };
      
      const res = await axios.post(`${API_URL}/live-classes`, testClass, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });
      
      testClasses.push(res.data.data);
      console.log(`  ✅ Created: ${testClass.title}`);
    }
    
    // Check scheduled classes before deletion
    console.log('\n4. Checking scheduled classes before deletion...');
    const beforeRes = await axios.get(`${API_URL}/live-classes`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    
    const scheduledBefore = beforeRes.data.data.filter(lc => 
      lc.status === 'scheduled' && lc.teacher._id === loginRes.data.user.id
    );
    
    console.log(`  📊 Found ${scheduledBefore.length} scheduled classes`);
    
    // Perform bulk delete
    console.log('\n5. Performing bulk delete...');
    const deleteRes = await axios.delete(`${API_URL}/live-classes/bulk/scheduled`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    
    console.log(`  ✅ Bulk delete successful!`);
    console.log(`  📊 Deleted ${deleteRes.data.data.deletedCount} classes`);
    
    // Check scheduled classes after deletion
    console.log('\n6. Checking scheduled classes after deletion...');
    const afterRes = await axios.get(`${API_URL}/live-classes`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    
    const scheduledAfter = afterRes.data.data.filter(lc => 
      lc.status === 'scheduled' && lc.teacher._id === loginRes.data.user.id
    );
    
    console.log(`  📊 Found ${scheduledAfter.length} scheduled classes`);
    
    // Verify deletion
    console.log('\n7. Verification:');
    if (scheduledAfter.length === 0) {
      console.log('  ✅ All scheduled classes successfully deleted!');
    } else {
      console.log(`  ⚠️ ${scheduledAfter.length} scheduled classes still remain`);
    }
    
    // Check as student to ensure they don't see deleted classes
    console.log('\n8. Verifying from student perspective...');
    const studentLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'hbaviskar1106@gmail.com',
      password: 'password123'
    });
    
    const studentToken = studentLoginRes.data.token;
    
    const studentRes = await axios.get(`${API_URL}/live-classes`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    
    const deletedClassIds = testClasses.map(tc => tc._id);
    const studentSeesDeleted = studentRes.data.data.some(lc => 
      deletedClassIds.includes(lc._id)
    );
    
    if (!studentSeesDeleted) {
      console.log('  ✅ Student correctly does not see deleted classes');
    } else {
      console.log('  ❌ Student can still see deleted classes!');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Bulk Delete Feature Test Complete!');
    console.log('='.repeat(60));
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testBulkDelete();